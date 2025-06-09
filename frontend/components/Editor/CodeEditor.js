// components/Editor/CodeEditor.js

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import api from '../../lib/axios';

export default function CodeEditor({
  value = '',
  language = 'javascript',
  onChange,
  onCursorActivity,
  height = '500px',
  readOnly = false,
  theme = 'vs-dark',
  enableRun = false,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');

  // mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsLoading(false);

    if (onCursorActivity) {
      editor.onDidChangeCursorPosition(e =>
        onCursorActivity({ lineNumber: e.position.lineNumber, column: e.position.column })
      );
    }
    if (onChange) {
      editor.onDidChangeModelContent(() =>
        onChange(editor.getValue(), language)
      );
    }

    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
    });
  };

  // switch language
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      monacoRef.current.editor.setModelLanguage(model, language);
    }
  }, [language]);

  // run
  const run = async () => {
    setIsRunning(true);
    setOutput('');
    try {
      const code = editorRef.current.getValue();
      const res = await api.post('/execute', { code, language });
      setOutput(res.data.output || res.data.stdout || res.data.stderr || 'No output');
    } catch (err) {
      setOutput('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col" style={{ height }}>
      {enableRun && (
        <div className="flex justify-end mb-1 z-10">
          <button
            onClick={run}
            disabled={isRunning || readOnly}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            {isRunning ? 'Running…' : 'Run'}
          </button>
        </div>
      )}

      {/* EDITOR */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <p>Loading editor...</p>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            selectOnLineNumbers: true,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 20,
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            contextmenu: true,
            mouseWheelZoom: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900 text-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                <p>Loading Monaco Editor...</p>
              </div>
            </div>
          }
        />
      </div>

      {/* OUTPUT PANEL */}
      {enableRun && (
        <div
          className="mt-2 p-2 bg-gray-100 overflow-auto text-sm font-mono"
          style={{ minHeight: '50px', maxHeight: '200px' }}
        >
          <pre>{output}</pre>
        </div>
      )}

      <div className="absolute top-2 left-1 bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono">
        {language.toUpperCase()}
      </div>

      <div className="absolute bottom-2 right-2 flex items-center space-x-2 text-xs">
        <div className="bg-gray-800 text-white px-2 py-1 rounded">
          Lines: {(value || '').split('\n').length}
        </div>
      </div>
    </div>
  );
}

export function getLanguageConfig(lang) {
  const configs = {
    javascript: {
      language: 'javascript',
      defaultValue: '// Welcome…\nconsole.log("Hello!");',
    },
    python: {
      language: 'python',
      defaultValue: '# Welcome…\nprint("Hello!")',
    },
    java: {
      language: 'java',
      defaultValue:
        '// Welcome…\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello!");\n  }\n}',
    },
    cpp: {
      language: 'cpp',
      defaultValue:
        '// Welcome…\n#include <iostream>\nusing namespace std;\nint main(){ cout<<"Hello!"; }',
    },
    html: {
      language: 'html',
      defaultValue: '<!-- Hello world -->\n<html><body><h1>Hello!</h1></body></html>',
    },
    css: {
      language: 'css',
      defaultValue: '/* Hello world */\nbody { font-family: sans-serif; }',
    },
  };
  return configs[lang] || configs.javascript;
}
