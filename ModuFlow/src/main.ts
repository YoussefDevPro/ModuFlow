import { invoke } from '@tauri-apps/api/core';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror'; // Basic setup from the bundled package
import {rust} from "@codemirror/lang-rust"; // Pour la coloration syntaxique du Rust

// Lorsque le DOM est chargé, récupère la liste des fichiers et l'affiche
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const files = await invoke<string[]>('list_files');
    console.log('File list:', files);

    const fileListContainer = document.getElementById('file-list');
    if (fileListContainer) {
      fileListContainer.innerHTML = '';
      files.forEach((file: string) => {
        const li = document.createElement('li');
        li.textContent = file;
        fileListContainer.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Error fetching files:', error);
  }
});

// Crée l'éditeur CodeMirror dans l'élément avec l'ID "editor-container"
const editorContainer = document.getElementById('editor-container');
if (editorContainer) {
  const state = EditorState.create({
    doc: '// Your code here...',
    extensions: [
      basicSetup,
      rust(),
      // Ajoute une extension de thème pour définir la taille de police et la police
      EditorView.theme({
        '.cm-content': {
          fontSize: '16px',
          fontFamily: "'Fira Code', monospace"
        }
      })
    ]
  });

  new EditorView({
    state,
    parent: editorContainer
  });
}
