import fs from "node:fs";
import path from "node:path";
import { Types } from "mongoose";

import { normalizeLocalized, type Localized } from "@/lib/academy/localized";
import { hashPassword } from "@/lib/password";
import type { UserLanguage } from "@/lib/user-languages";
import { AcademyUser } from "@/models/academy-user";
import { Course } from "@/models/course";
import { DEFAULT_PASS_THRESHOLD, Exam, type QuestionType } from "@/models/exam";
import { Lesson } from "@/models/lesson";

// `npm run seed`: the first tutor (and optionally a student) plus the sample
// courses. Re-running updates in place — courses are keyed by slug, users by
// email, lessons by number, activities by module — so the script can be
// used to refresh the seed content without wiping anything.

// No dotenv in the project: `.env.local` is read by hand, before anything
// that reads `process.env` at import time (`src/lib/mongodb.ts`) is loaded.
function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) {
    return;
  }

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator < 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

type SeedQuestion = {
  qtype: QuestionType;
  text: Localized;
  statementIsTrue?: boolean;
  explanation?: Localized;
  options?: { text: Localized; correct: boolean }[];
};

type SeedActivity = {
  scope: "module" | "final";
  module?: number;
  questions: SeedQuestion[];
};

type SeedLesson = {
  number: number;
  // Either an explicit module number or a manual chapter that a module lists.
  module?: number;
  chapter?: number;
  title: Localized;
  description: Localized;
  youtubeId: string | null;
};

type SeedModule = {
  number: number;
  title: Localized;
  chapters?: number[];
};

type SeedCourse = {
  course: {
    slug: string;
    title: Localized;
    description: Localized;
    language: UserLanguage;
    published: boolean;
    starter: boolean;
    order: number;
    coverUrl: string;
    speaker: string;
    prerequisiteSlugs?: string[];
  };
  modules: SeedModule[];
  lessonDefaults: { durationMinutes: number; published: boolean; provider: "youtube" | "bunny" };
  lessons: SeedLesson[];
  activities: SeedActivity[];
};

function readSeed(name: string): SeedCourse {
  const file = path.resolve(process.cwd(), "scripts", "seed-data", name);
  return JSON.parse(fs.readFileSync(file, "utf8")) as SeedCourse;
}

async function seedUser(role: "tutor" | "student") {
  const prefix = role === "tutor" ? "SEED_TUTOR" : "SEED_STUDENT";
  const label = role === "tutor" ? "Tutor" : "Aluno";
  const email = process.env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = process.env[`${prefix}_PASSWORD`];
  const fullName =
    process.env[`${prefix}_NAME`]?.trim() || (role === "tutor" ? "Tutor(a)" : "Aluno de teste");

  if (!email || !password) {
    console.log(`${label}: ${prefix}_EMAIL / ${prefix}_PASSWORD não definidos, pulando.`);
    return null;
  }

  const existing = await AcademyUser.findOne({ email });
  if (existing) {
    console.log(`${label}: ${email} já existe (${existing.role}), mantido.`);
    return existing;
  }

  const user = await AcademyUser.create({
    fullName,
    email,
    login: email,
    password: await hashPassword(password),
    role,
    language: "pt",
    country: "Brasil",
  });

  console.log(`${label}: ${email} criado.`);
  return user;
}

function moduleNumberFor(lesson: SeedLesson, modules: SeedModule[]) {
  if (lesson.module != null) {
    return lesson.module;
  }

  const owner = modules.find((mod) => lesson.chapter != null && mod.chapters?.includes(lesson.chapter));
  if (!owner) {
    throw new Error(`Aula ${lesson.number} não pertence a nenhum módulo`);
  }

  return owner.number;
}

async function seedCourse(data: SeedCourse) {
  const prerequisites: Types.ObjectId[] = [];
  for (const slug of data.course.prerequisiteSlugs ?? []) {
    const prerequisite = await Course.findOne({ slug }).select("_id");
    if (!prerequisite) {
      throw new Error(`Pré-requisito "${slug}" não encontrado; rode o curso base primeiro`);
    }
    prerequisites.push(prerequisite._id);
  }

  const existing = await Course.findOne({ slug: data.course.slug });

  // Module ids are what lessons and activities point at, so a re-run keeps
  // the ids of modules it already created and only mints new ones.
  const modules = data.modules.map((mod) => {
    const prior = existing?.modules.find((item) => item.number === mod.number);
    return { _id: prior?._id ?? new Types.ObjectId(), number: mod.number, title: normalizeLocalized(mod.title) };
  });
  const moduleId = (number: number) => {
    const mod = modules.find((item) => item.number === number);
    if (!mod) {
      throw new Error(`Módulo ${number} não existe no curso ${data.course.slug}`);
    }
    return mod._id;
  };

  const course = existing ?? new Course({ slug: data.course.slug });
  course.set({
    title: normalizeLocalized(data.course.title),
    description: normalizeLocalized(data.course.description),
    language: data.course.language,
    published: data.course.published,
    starter: data.course.starter,
    order: data.course.order,
    coverUrl: data.course.coverUrl,
    speaker: data.course.speaker,
    prerequisites,
    modules,
  });
  await course.save();

  for (const lesson of data.lessons) {
    await Lesson.findOneAndUpdate(
      { courseId: course._id, number: lesson.number },
      {
        $set: {
          moduleId: moduleId(moduleNumberFor(lesson, data.modules)),
          title: normalizeLocalized(lesson.title),
          description: normalizeLocalized(lesson.description),
          durationMinutes: data.lessonDefaults.durationMinutes,
          video: { provider: data.lessonDefaults.provider, youtubeId: lesson.youtubeId ?? "", bunnyVideoId: "" },
          materials: [],
          published: data.lessonDefaults.published,
        },
      },
      { upsert: true },
    );
  }

  for (const activity of data.activities) {
    const filter = {
      courseId: course._id,
      scope: activity.scope,
      moduleId: activity.scope === "module" ? moduleId(activity.module!) : null,
    };
    const prior = await Exam.findOne(filter);

    // Question and option ids are the answer key students' attempts refer
    // to; keep them stable across re-runs by position.
    const questions = activity.questions.map((question, index) => {
      const priorQuestion = prior?.questions[index];
      return {
        _id: priorQuestion?._id ?? new Types.ObjectId(),
        qtype: question.qtype,
        text: normalizeLocalized(question.text),
        statementIsTrue: question.statementIsTrue ?? false,
        explanation: normalizeLocalized(question.explanation),
        options: (question.options ?? []).map((option, optionIndex) => ({
          _id: priorQuestion?.options[optionIndex]?._id ?? new Types.ObjectId(),
          text: normalizeLocalized(option.text),
          correct: option.correct,
        })),
      };
    });

    if (prior) {
      prior.set({ passThreshold: DEFAULT_PASS_THRESHOLD, requiredToAdvance: true, questions });
      await prior.save();
    } else {
      await Exam.create({ ...filter, passThreshold: DEFAULT_PASS_THRESHOLD, requiredToAdvance: true, questions });
    }
  }

  console.log(
    `Curso "${data.course.title.pt}" (${data.course.slug}): ${modules.length} módulos, ${data.lessons.length} aulas, ${data.activities.length} atividades${existing ? " (atualizado)" : " (criado)"}.`,
  );

  return course;
}

async function main() {
  loadEnvLocal();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI não está definida (.env.local)");
  }

  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();

  const tutor = await seedUser("tutor");
  const student = await seedUser("student");

  const kit1 = await seedCourse(readSeed("kit1.json"));
  const vidaDeFe = await seedCourse(readSeed("vida-de-fe.json"));

  console.log("\nResumo:");
  console.log(`  tutor:    ${tutor ? tutor.email : "—"}`);
  console.log(`  aluno:    ${student ? student.email : "—"}`);
  console.log(`  cursos:   ${kit1.slug} (${kit1._id}), ${vidaDeFe.slug} (${vidaDeFe._id}, requer ${kit1.slug})`);
  console.log(`  aulas:    ${await Lesson.countDocuments({ courseId: { $in: [kit1._id, vidaDeFe._id] } })}`);
  console.log(`  atividades: ${await Exam.countDocuments({ courseId: { $in: [kit1._id, vidaDeFe._id] } })}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Seed falhou:", error);
  process.exit(1);
});
