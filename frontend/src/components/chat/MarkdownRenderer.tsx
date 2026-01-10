"use client";

import { useMemo, useCallback, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Download, Table, FileSpreadsheet, Check } from "lucide-react";
import * as XLSX from "xlsx";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface ParsedTable {
  id: string;
  headers: string[];
  rows: string[][];
  title?: string;
}

// 마크다운에서 테이블 파싱
function extractTables(content: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const lines = content.split('\n');

  let currentTable: { headers: string[]; rows: string[][]; startIndex: number } | null = null;
  let tableIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 테이블 시작 감지 (| 로 시작하고 끝남)
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!currentTable) {
        // 첫 번째 행 = 헤더
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        currentTable = { headers: cells, rows: [], startIndex: i };
      } else if (line.match(/^\|[\s\-:]+\|$/)) {
        // 구분선 - 스킵
        continue;
      } else {
        // 데이터 행
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        currentTable.rows.push(cells);
      }
    } else {
      // 테이블 종료
      if (currentTable && currentTable.rows.length > 0) {
        // 테이블 제목 찾기 (테이블 위의 ### 또는 ** 텍스트)
        let title: string | undefined;
        for (let j = currentTable.startIndex - 1; j >= 0; j--) {
          const prevLine = lines[j].trim();
          if (prevLine) {
            if (prevLine.startsWith('#')) {
              title = prevLine.replace(/^#+\s*/, '');
            } else if (prevLine.startsWith('**') && prevLine.endsWith('**')) {
              title = prevLine.replace(/^\*\*|\*\*$/g, '');
            } else if (prevLine.length > 0 && prevLine.length < 50) {
              title = prevLine;
            }
            break;
          }
        }

        tables.push({
          id: `table-${tableIndex++}`,
          headers: currentTable.headers,
          rows: currentTable.rows,
          title,
        });
      }
      currentTable = null;
    }
  }

  // 마지막 테이블 처리
  if (currentTable && currentTable.rows.length > 0) {
    let title: string | undefined;
    for (let j = currentTable.startIndex - 1; j >= 0; j--) {
      const prevLine = lines[j].trim();
      if (prevLine) {
        if (prevLine.startsWith('#')) {
          title = prevLine.replace(/^#+\s*/, '');
        } else if (prevLine.startsWith('**') && prevLine.endsWith('**')) {
          title = prevLine.replace(/^\*\*|\*\*$/g, '');
        }
        break;
      }
    }

    tables.push({
      id: `table-${tableIndex}`,
      headers: currentTable.headers,
      rows: currentTable.rows,
      title,
    });
  }

  return tables;
}

// Excel 다운로드 버튼 컴포넌트
function DownloadButton({
  onClick,
  label,
  variant = "default",
}: {
  onClick: () => void;
  label: string;
  variant?: "default" | "primary";
}) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = () => {
    onClick();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
        variant === "primary"
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200",
        downloaded && "bg-green-100 text-green-800"
      )}
    >
      {downloaded ? (
        <>
          <Check className="w-3.5 h-3.5" />
          다운로드 완료
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const tableRefs = useRef<Map<number, HTMLTableElement>>(new Map());
  const tables = useMemo(() => extractTables(content), [content]);

  // 개별 테이블 다운로드
  const downloadTable = useCallback((tableIndex: number) => {
    const table = tables[tableIndex];
    if (!table) return;

    const worksheetData = [table.headers, ...table.rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 열 너비 자동 조정
    const colWidths = table.headers.map((header, idx) => {
      const maxLength = Math.max(
        header.length,
        ...table.rows.map(row => (row[idx] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, table.title?.slice(0, 31) || 'Data');

    const fileName = `${(table.title || 'table').replace(/[\\\/\*\?\[\]:]/g, '')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [tables]);

  // 전체 테이블 다운로드
  const downloadAllTables = useCallback(() => {
    if (tables.length === 0) return;

    const workbook = XLSX.utils.book_new();

    tables.forEach((table, index) => {
      const worksheetData = [table.headers, ...table.rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      const colWidths = table.headers.map((header, idx) => {
        const maxLength = Math.max(
          header.length,
          ...table.rows.map(row => (row[idx] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      worksheet['!cols'] = colWidths;

      let sheetName = (table.title || `Sheet${index + 1}`)
        .replace(/[\\\/\*\?\[\]:]/g, '')
        .slice(0, 31);

      // 중복 이름 처리
      let finalName = sheetName;
      let counter = 1;
      while (workbook.SheetNames.includes(finalName)) {
        finalName = `${sheetName.slice(0, 28)}_${counter++}`;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, finalName);
    });

    const fileName = `분석보고서_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [tables]);

  // 테이블 인덱스 추적
  let tableIndex = -1;

  if (!content) return null;

  return (
    <div className={cn("markdown-content", className)}>
      {/* 전체 테이블 다운로드 버튼 */}
      {tables.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Table className="w-4 h-4" />
            <span>{tables.length}개의 테이블이 포함되어 있습니다</span>
          </div>
          <DownloadButton
            onClick={downloadAllTables}
            label={`전체 다운로드 (${tables.length}개)`}
            variant="primary"
          />
        </div>
      )}

      {/* 마크다운 렌더링 */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ children, ...props }) => (
              <h1 className="text-2xl font-bold text-gray-800 mt-6 mb-3 pb-2 border-b border-gray-200" {...props}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 className="text-xl font-bold text-gray-800 mt-5 mb-2" {...props}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2" {...props}>
                {children}
              </h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 className="text-base font-semibold text-gray-700 mt-3 mb-1" {...props}>
                {children}
              </h4>
            ),
            pre: ({ children, ...props }) => (
              <pre
                className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-3 text-sm"
                {...props}
              >
                {children}
              </pre>
            ),
            code: ({ className: codeClassName, children, ...props }) => {
              const isInline = !codeClassName;
              if (isInline) {
                return (
                  <code
                    className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children, ...props }) => (
              <p className="my-2 leading-relaxed text-gray-700" {...props}>
                {children}
              </p>
            ),
            ul: ({ children, ...props }) => (
              <ul className="list-disc list-outside ml-5 my-2 space-y-1 text-gray-700" {...props}>
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-gray-700" {...props}>
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li className="leading-relaxed" {...props}>
                {children}
              </li>
            ),
            a: ({ children, href, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
                {...props}
              >
                {children}
              </a>
            ),
            blockquote: ({ children, ...props }) => (
              <blockquote
                className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-3 italic text-gray-600 rounded-r-lg"
                {...props}
              >
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-6 border-gray-200" />,
            strong: ({ children, ...props }) => (
              <strong className="font-semibold text-gray-800" {...props}>
                {children}
              </strong>
            ),
            em: ({ children, ...props }) => (
              <em className="italic text-gray-600" {...props}>
                {children}
              </em>
            ),
            table: ({ children, ...props }) => {
              tableIndex++;
              const currentTableIndex = tableIndex;
              const tableData = tables[currentTableIndex];

              return (
                <div className="my-4">
                  {/* 테이블 헤더 (제목 + 다운로드 버튼) */}
                  <div className="flex items-center justify-between mb-2">
                    {tableData?.title && (
                      <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                        <Table className="w-4 h-4 text-blue-500" />
                        {tableData.title}
                      </span>
                    )}
                    <DownloadButton
                      onClick={() => downloadTable(currentTableIndex)}
                      label="Excel 다운로드"
                    />
                  </div>
                  {/* 테이블 */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                    <table
                      ref={(el) => {
                        if (el) tableRefs.current.set(currentTableIndex, el);
                      }}
                      className="min-w-full divide-y divide-gray-200"
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                  {tableData && (
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {tableData.rows.length}개 행 x {tableData.headers.length}개 열
                    </p>
                  )}
                </div>
              );
            },
            thead: ({ children, ...props }) => (
              <thead className="bg-gray-50" {...props}>
                {children}
              </thead>
            ),
            tbody: ({ children, ...props }) => (
              <tbody className="bg-white divide-y divide-gray-200" {...props}>
                {children}
              </tbody>
            ),
            tr: ({ children, ...props }) => (
              <tr className="hover:bg-gray-50 transition-colors" {...props}>
                {children}
              </tr>
            ),
            th: ({ children, ...props }) => (
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-100"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap" {...props}>
                {children}
              </td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
