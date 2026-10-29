"use client";

import { useCallback, useEffect, useState } from "react";

import { AccountActions } from "@/components/admin/account-actions";
import { PageHeading } from "@/components/admin/admin-shell";
import { toastError, useDateFormat } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Badge } from "@/components/ui/badge";
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
import type { AdminPastorRow } from "@/lib/academy/types";

export function PastorsTable() {
  const { t } = useLocale();
  const formatDate = useDateFormat();
  const [pastors, setPastors] = useState<AdminPastorRow[] | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    api<{ pastors: AdminPastorRow[] }>("/api/admin/pastores")
      .then((data) => {
        if (!cancelled) setPastors(data.pastors);
      })
      .catch((error) => toastError(error, t.common.error));

    return () => {
      cancelled = true;
    };
  }, [version, t]);

  return (
    <>
      <PageHeading
        title={t.admin.pastorsHeading}
        description={t.admin.pastorsDescription}
        actions={<AccountActions kind="pastor" onCreated={reload} />}
      />

      <Card className="border-border/60 shadow-card">
        <CardContent className="p-0">
          {!pastors ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : pastors.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t.admin.noPastors}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.colName}</TableHead>
                    <TableHead>{t.auth.email}</TableHead>
                    <TableHead>{t.auth.phone}</TableHead>
                    <TableHead>{t.admin.colChurch}</TableHead>
                    <TableHead>{t.admin.colCountry}</TableHead>
                    <TableHead>{t.admin.colRole}</TableHead>
                    <TableHead>{t.admin.colSignedUp}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastors.map((pastor) => (
                    <TableRow key={pastor.id}>
                      <TableCell className="font-medium text-primary-deep">{pastor.fullName}</TableCell>
                      <TableCell className="whitespace-nowrap">{pastor.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{pastor.phone || "—"}</TableCell>
                      <TableCell>{pastor.churchName || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{pastor.country || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={pastor.role === "pastor" ? "default" : "outline"}>
                          {pastor.role === "pastor" ? t.admin.kinds.pastor : t.admin.libraryMember}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(pastor.createdAt)}</TableCell>
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
