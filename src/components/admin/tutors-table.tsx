"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AccountActions } from "@/components/admin/account-actions";
import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Card, CardContent } from "@/components/ui/card";
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

export function TutorsTable() {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [tutors, setTutors] = useState<AdminStudentRow[] | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    api<{ tutors: AdminStudentRow[] }>("/api/admin/tutores")
      .then((data) => {
        if (!cancelled) setTutors(data.tutors);
      })
      .catch((error) => toastError(error, t.common.error));

    return () => {
      cancelled = true;
    };
  }, [version, t]);

  return (
    <>
      <PageHeading
        title={t.admin.tutorsHeading}
        description={t.admin.tutorsDescription}
        actions={<AccountActions kind="educador" onCreated={reload} />}
      />

      <Card className="border-border/60 shadow-card">
        <CardContent className="p-0">
          {!tutors ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t.admin.noTutors}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.colName}</TableHead>
                    <TableHead>{t.auth.email}</TableHead>
                    <TableHead>{t.admin.colCountry}</TableHead>
                    <TableHead>{t.admin.statStudents}</TableHead>
                    <TableHead>{t.admin.colSignedUp}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell>
                        <Link
                          href={`/admin/alunos/${tutor.id}`}
                          className="font-medium text-primary-deep hover:underline"
                        >
                          {tutor.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{tutor.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{tutor.country || "—"}</TableCell>
                      <TableCell>{tutor.enrollmentCount}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(tutor.createdAt)}</TableCell>
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
