"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/academy/api-client";
import type { AdminStudentRow } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "nocontact" | "contacted";
type Sort = "name" | "createdAt" | "country" | "firstContact" | "lastSeen";

function SortHead({
  column,
  sort,
  dir,
  onToggle,
  children,
}: {
  column: Sort;
  sort: Sort;
  dir: "asc" | "desc";
  onToggle: (column: Sort) => void;
  children: React.ReactNode;
}) {
  const active = column === sort;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onToggle(column)}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap font-medium hover:text-foreground",
          active && "text-primary-deep",
        )}
      >
        {children}
        {active ? (
          dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : null}
      </button>
    </TableHead>
  );
}

export function StudentsTable() {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [students, setStudents] = useState<AdminStudentRow[] | null>(null);

  // Typing should not fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams({ search: query, filter, sort, dir });
    let cancelled = false;

    api<{ students: AdminStudentRow[] }>(`/api/admin/alunos?${params}`)
      .then((data) => {
        if (!cancelled) setStudents(data.students);
      })
      .catch((error) => toastError(error, t.common.error));

    return () => {
      cancelled = true;
    };
  }, [query, filter, sort, dir, t]);

  function toggleSort(next: Sort) {
    if (next === sort) {
      setDir(dir === "asc" ? "desc" : "asc");
    } else {
      setSort(next);
      setDir(next === "name" || next === "country" ? "asc" : "desc");
    }
  }

  return (
    <>
      <PageHeading title={t.admin.studentsHeading} description={t.admin.studentsDescription} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.admin.searchStudents}
            className="pl-9"
            aria-label={t.admin.searchStudents}
          />
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <SelectTrigger className="sm:w-56" aria-label={t.admin.colFirstContact}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.filterAll}</SelectItem>
            <SelectItem value="nocontact">{t.admin.filterNoContact}</SelectItem>
            <SelectItem value="contacted">{t.admin.filterContacted}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 shadow-card">
        <CardContent className="p-0">
          {!students ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t.admin.noStudents}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead column="name" sort={sort} dir={dir} onToggle={toggleSort}>{t.admin.colName}</SortHead>
                    <SortHead column="country" sort={sort} dir={dir} onToggle={toggleSort}>{t.admin.colCountry}</SortHead>
                    <TableHead>{t.admin.colTutor}</TableHead>
                    <TableHead>{t.admin.colCourses}</TableHead>
                    <SortHead column="createdAt" sort={sort} dir={dir} onToggle={toggleSort}>{t.admin.colSignedUp}</SortHead>
                    <SortHead column="firstContact" sort={sort} dir={dir} onToggle={toggleSort}>{t.admin.colFirstContact}</SortHead>
                    <SortHead column="lastSeen" sort={sort} dir={dir} onToggle={toggleSort}>{t.admin.colLastSeen}</SortHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Link
                          href={`/admin/alunos/${student.id}`}
                          className="font-medium text-primary-deep hover:underline"
                        >
                          {student.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{student.country || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {student.tutor?.fullName ?? (
                          <span className="text-muted-foreground">{t.admin.noTutor}</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {student.enrollmentCount} · {student.completedCount}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(student.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {student.firstContactAt ? (
                          <Badge variant="secondary">{t.admin.firstContactDone}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t.admin.firstContactPending}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(student.lastSeenAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
