<script lang="ts">
  import { afterUpdate, onDestroy, onMount } from "svelte";
  import * as monaco from "monaco-editor";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
  import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
  import { RequestDataType } from "$lib/utils/enums/request.enum";
  import { isHorizontal } from "$lib/store/request-response-section";
  // import {
  //   handleisRawBodyValid,
  // } from "$lib/store/request-response-section";

  export let currentTabId: string;
  export let rawTab: RequestDataType;
  export let rawValue;
  export let callback;
  export let value = "";

  let editorElement: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor;
  let model: monaco.editor.ITextModel;
  let selectedRawTab: RequestDataType;
  let selectedTabId = currentTabId;

  let rawData = {
    raw: "",
    type: RequestDataType.TEXT,
  };

  function loadCode(code: string, language: string) {
    model = monaco.editor.createModel(code, language);
    editor.setModel(model);
  }

  const handleRawTypes = (code: string, rawTab: RequestDataType) => {
    switch (rawTab) {
      case RequestDataType.HTML:
        loadCode(code, "html");
        break;
      case RequestDataType.JAVASCRIPT:
        loadCode(code, "javascript");
        break;
      case RequestDataType.JSON:
        loadCode(code, "json");
        break;
      case RequestDataType.XML:
        loadCode(code, "xml");
        break;
      case RequestDataType.TEXT:
        loadCode(code, "plaintext");
        break;
      default:
        loadCode(code, "plaintext");
        break;
    }
    selectedRawTab = rawTab;
    // handleisRawBodyValid(currentTabId, false);
  };
  export const getRawData = () => {
    rawData = {
      type: rawTab,
      raw: rawValue,
    };
    return rawData;
  };

  const currentRawData = getRawData();

  onMount(async () => {
    // @ts-ignore
    //used for error highlighting
    self.MonacoEnvironment = {
      getWorker: function (_: any, label: string) {
        if (label === "json") {
          return new jsonWorker();
        }
        if (label === "html" || label === "xml") {
          return new htmlWorker();
        }
        if (label === "javascript") {
          return new tsWorker();
        }
        return new editorWorker();
      },
    };

    monaco.editor.defineTheme("myTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "key", foreground: "#9CDCFE" },
        { token: "string.key.json", foreground: "#9CDCFE" },
        { token: "string.value.json", foreground: "#CE9178" },
        { token: "delimiter.bracket", foreground: "#FFFFFF" },
        { token: "delimiter", foreground: "#FFFFFF" },
      ],
      colors: {
        "editor.background": '#1E1E1E',
      },
    });
    monaco.editor.setTheme("myTheme");
    editor = monaco.editor.create(editorElement, {
      value,
      automaticLayout: true,
      theme: "myTheme",
      autoIndent: "brackets",
      formatOnPaste: true,
      formatOnType: true,
      wordWrap:"on",
      fixedOverflowWidgets: true,
      autoDetectHighContrast: false,
      scrollbar: {
        // Use customScrollbar to prevent overflow on the scrollbar
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        horizontalScrollbarSize: 8,
        verticalScrollbarSize: 0,
      },
    });

    selectedRawTab = rawTab;
    //for closing tag
    editor.onKeyDown((event) => {
      // select enabled languages
      const enabledLanguages = ["html", "markdown", "javascript", "typescript"]; // enable js & ts for jsx & tsx

      const model = editor.getModel();
      if (!enabledLanguages.includes(model.getLanguageId())) {
        return;
      }

      const isSelfClosing = (tag) =>
        [
          "area",
          "base",
          "br",
          "col",
          "command",
          "embed",
          "hr",
          "img",
          "input",
          "keygen",
          "link",
          "meta",
          "param",
          "source",
          "track",
          "wbr",
          "circle",
          "ellipse",
          "line",
          "path",
          "polygon",
          "polyline",
          "rect",
          "stop",
          "use",
        ].includes(tag);

      // when the user enters '>'
      if (event.browserEvent.key === ">") {
        const currentSelections = editor.getSelections();

        const edits = [];
        const newSelections = [];
        // potentially insert the ending tag at each of the selections
        for (const selection of currentSelections) {
          // shift the selection over by one to account for the new character
          newSelections.push(
            new monaco.Selection(
              selection.selectionStartLineNumber,
              selection.selectionStartColumn + 1,
              selection.endLineNumber,
              selection.endColumn + 1,
            ),
          );
          // grab the content before the cursor
          const contentBeforeChange = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          });

          // if ends with a HTML tag we are currently closing
          const match = contentBeforeChange.match(
            /<([\w-]+)(?![^>]*\/>)[^>]*$/,
          );
          if (!match) {
            continue;
          }

          const [fullMatch, tag] = match;

          // skip self-closing tags like <br> or <img>
          if (isSelfClosing(tag) || fullMatch.trim().endsWith("/")) {
            continue;
          }

          // add in the closing tag
          edits.push({
            range: {
              startLineNumber: selection.endLineNumber,
              startColumn: selection.endColumn + 1, // add 1 to offset for the inserting '>' character
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn + 1,
            },
            text: `</${tag}>`,
          });
        }

        // wait for next tick to avoid it being an invalid operation
        setTimeout(() => {
          editor.executeEdits(model.getValue(), edits, newSelections);
        }, 0);
      }
    });

    editor.onDidChangeModelContent((e) => {
      const input = editor.getValue();
      callback(input);
    });

    monaco.editor.onDidChangeMarkers((Uri: monaco.Uri[]) => {
      const uriId = Number(Uri[0].path.slice(1));
      const model = editor.getModel();
      const markers = monaco.editor.getModelMarkers({ resource: Uri[0] });
      if (markers && markers.length > 0 && model?.id === `$model${uriId}`) {
        // handleisRawBodyValid(currentTabId, true);
      } else {
        // handleisRawBodyValid(currentTabId, false);
      }
    });

    handleRawTypes(currentRawData.raw, currentRawData.type);
  });

  onDestroy(() => {
    // monaco?.editor.getModels().forEach((model) => model.dispose());
    editor?.dispose();
  });

  afterUpdate(() => {
    if (rawTab !== selectedRawTab) {
      const rawData = editor.getValue();
      handleRawTypes(rawData, rawTab);
    }
    if (selectedTabId !== currentTabId) {
      const rawData = getRawData();
      handleRawTypes(rawData.raw, rawData.type);
      selectedTabId = currentTabId;
    }
  });

  let isHorizontalMode: boolean;
  const isHorizontalUnsubscribe = isHorizontal.subscribe(
    (value) => {
      isHorizontalMode = value;
    },
  );

  onDestroy(() => {
    isHorizontalUnsubscribe();
  });
</script>

<div class="code-editor" bind:this={editorElement} />

<style>
  .code-editor {
    width: 99%;
    height: 250px;
  }
</style>
