"use client";

import { Download, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { PageHeading } from "@/components/admin/admin-shell";
import {
  IMPORT_MAX_ROWS,
  downloadText,
  parseAccountsCsv,
  resultCsv,
  templateCsv,
  type ParsedImport,
} from "@/components/admin/csv-accounts";
import { toastError } from "@/components/admin/helpers";
import { useLocale } from "@/components/academy/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/academy/api-client";
import type { AccountKind, AdminImportResult, AdminImportRowResult } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

const KINDS: readonly AccountKind[] = ["pastor", "hjteam", "educador"];

function isKind(value: unknown): value is AccountKind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

// Status tones from the theme's own accents, so dark mode follows.
const STATUS_TONE: Record<AdminImportRowResult["status"], string> = {
  created: "border-transparent bg-mint text-mint-foreground",
  exists: "border-coral/40 bg-coral/15 text-foreground",
  invalid: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function ImportAccounts() {
  const { t } = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [result, setResult] = useState<AdminImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setResult(null);
    setParsed(parseAccountsCsv(text));
  }

  async function runImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    try {
      const data = await api<AdminImportResult>("/api/admin/contas/importar", {
        method: "POST",
        body: { rows: parsed.rows },
      });
      setResult(data);
    } catch (error) {
      toastError(error, t.common.error);
    } finally {
      setImporting(false);
    }
  }

  const kindLabel = (kind: unknown) => (isKind(kind) ? t.admin.kinds[kind] : String(kind ?? ""));

  return (
    <>
      <PageHeading title={t.admin.importHeading} description={t.admin.importDescription} />

      <div className="space-y-6">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="text-base">{t.admin.importCsv}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t.admin.importColumns}</p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => downloadText("modelo-contas.csv", templateCsv())}
              >
                <Download className="h-4 w-4" />
                {t.admin.importExample}
              </Button>

              <input
                ref={fileInput}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handleFile(file);
                }}
              />
              <Button
                type="button"
                className="rounded-full"
                disabled={importing}
                onClick={() => fileInput.current?.click()}
              >
                <FileUp className="h-4 w-4" />
                {t.admin.chooseFile}
              </Button>
              {fileName ? (
                <span className="truncate text-sm text-muted-foreground" title={fileName}>
                  {fileName}
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {parsed && !result ? (
          <Card className="border-border/60 shadow-card">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">{t.admin.importPreview(parsed.rows.length)}</CardTitle>
                {parsed.truncated ? (
                  <p className="text-sm text-destructive" role="note">
                    {t.admin.importCapped(IMPORT_MAX_ROWS, parsed.totalLines)}
                  </p>
                ) : null}
                {parsed.unknownHeaders.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="mr-1">{t.admin.unknownColumns}</span>
                    {parsed.unknownHeaders.map((header) => (
                      <code key={header} className="mr-1 rounded bg-muted px-1.5 py-0.5 line-through">
                        {header}
                      </code>
                    ))}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                className="rounded-full"
                disabled={importing || parsed.rows.length === 0}
                onClick={() => void runImport()}
              >
                <Upload className="h-4 w-4" />
                {importing ? t.admin.importing : t.admin.importRun}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.admin.colLine}</TableHead>
                      <TableHead>{t.admin.accountKind}</TableHead>
                      <TableHead>{t.admin.colName}</TableHead>
                      <TableHead>{t.auth.email}</TableHead>
                      <TableHead>{t.auth.phone}</TableHead>
                      <TableHead>{t.profile.birthday}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.rows.map((row) => {
                      const flagged = parsed.incomplete.has(row.line);
                      return (
                        <TableRow
                          key={row.line}
                          className={cn(flagged && "bg-destructive/5 text-destructive")}
                          aria-invalid={flagged ? true : undefined}
                        >
                          <TableCell className="tabular-nums">{row.line}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {isKind(row.kind) ? (
                              kindLabel(row.kind)
                            ) : (
                              <span className="text-destructive">{String(row.kind ?? "") || "—"}</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{row.fullName || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.email || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.phone || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {row.birthday ?? (row.age !== null && row.age !== undefined ? row.age : "—")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {result ? (
          <Card className="border-border/60 shadow-card">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                {t.admin.importDone(result.created, result.exists, result.invalid)}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => downloadText("contas-importadas.csv", resultCsv(result))}
              >
                <Download className="h-4 w-4" />
                {t.admin.importDownload}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.admin.colLine}</TableHead>
                      <TableHead>{t.admin.colStatus}</TableHead>
                      <TableHead>{t.admin.colName}</TableHead>
                      <TableHead>{t.auth.email}</TableHead>
                      <TableHead>{t.admin.accountKind}</TableHead>
                      <TableHead>{t.admin.colPassword}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row) => (
                      <TableRow key={row.line}>
                        <TableCell className="tabular-nums">{row.line}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={STATUS_TONE[row.status]}>
                            {t.admin.importStatus[row.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{row.fullName || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.email || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.kind ? kindLabel(row.kind) : "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.temporaryPassword ? (
                            <code className="select-all rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                              {row.temporaryPassword}
                            </code>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="min-w-[14rem] text-sm text-muted-foreground">{row.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
