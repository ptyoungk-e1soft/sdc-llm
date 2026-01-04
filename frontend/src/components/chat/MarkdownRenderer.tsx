"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children, ...props }) => (
          <pre
            className="bg-gray-900 text-gray-100 rounded-md p-4 overflow-x-auto my-2"
            {...props}
          >
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        p: ({ children, ...props }) => (
          <p className="my-2 leading-relaxed" {...props}>
            {children}
          </p>
        ),
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-inside my-2 space-y-1" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
            {children}
          </ol>
        ),
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            {...props}
          >
            {children}
          </a>
        ),
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-600"
            {...props}
          >
            {children}
          </blockquote>
        ),
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border-collapse border border-gray-300" {...props}>
              {children}
            </table>
          </div>
        ),
        th: ({ children, ...props }) => (
          <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left" {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td className="border border-gray-300 px-3 py-2" {...props}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
