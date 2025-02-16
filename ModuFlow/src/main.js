const { invoke } = window.__TAURI__.core;


document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Invoquer la commande Tauri "list_files" définie dans Rust
    const files = await invoke('list_files');
    console.log('Liste des fichiers :', files);

    // Afficher la liste des fichiers dans l'élément UL
    const fileListContainer = document.getElementById('file-list');
    fileListContainer.innerHTML = '';

    if (Array.isArray(files)) {
      files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file;
        fileListContainer.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers :', error);
  }
});

let editor;
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});

require(['vs/editor/editor.main'], function() {
  const container = document.getElementById('editor-container');
  const editor = monaco.editor.create(container, {
    value: '// Sélectionnez un fichier pour éditer son contenu...',
    language: 'rust',
    theme: 'vs-dark'
  });

  // Met à jour la taille de l'éditeur lors du redimensionnement de la fenêtre
  window.addEventListener('resize', () => {
    editor.layout();
  });
});