'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

export function RichTextField({
  html,
  editable,
  onChange,
  placeholder,
}: {
  html: string;
  editable: boolean;
  onChange?: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: html || '<p></p>',
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange?.(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'storefront-prose',
        'data-placeholder': placeholder ?? '',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (html !== current) {
      editor.commands.setContent(html || '<p></p>', { emitUpdate: false } as never);
    }
  }, [editor, html]);

  if (!editor) return null;

  return (
    <div>
      {editable ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => editor.chain().focus().toggleBold().run()}>
            Negrita
          </button>
          <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => editor.chain().focus().toggleItalic().run()}>
            Cursiva
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '4px 8px' }}
            onClick={() => {
              const href = window.prompt('URL del enlace (https://…)');
              if (!href) return;
              editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
            }}
          >
            Enlace
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
      <style jsx global>{`
        .storefront-prose {
          min-height: 88px;
          outline: none;
          line-height: 1.55;
          color: var(--text-primary);
        }
        .storefront-prose p {
          margin: 0 0 0.75rem;
        }
        .storefront-prose a {
          color: var(--brand-blue);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
