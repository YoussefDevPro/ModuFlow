import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
const fileExplorer = document.querySelector('.file-explorer') as HTMLElement;
let isResizing = false;

resizeHandle.addEventListener('mousedown', (_) => {
  isResizing = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
  });
});

function handleMouseMove(e: MouseEvent) {
  if (!isResizing) return;
  const newWidth = e.clientX;
  if (newWidth >= 200 && newWidth <= window.innerWidth * 0.8) {
    fileExplorer.style.width = newWidth + 'px';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const selectDirBtn = document.querySelector<HTMLButtonElement>('#selectDir');
  // Vous pouvez utiliser une div à la place d'un <pre> pour insérer des éléments HTML
  const resultContainer = document.querySelector<HTMLDivElement>('#result');

  if (selectDirBtn && resultContainer) {
    selectDirBtn.addEventListener('click', async () => {
      try {
        const selectedPath = await open({
          directory: true,
          multiple: false
        });

        if (selectedPath) {
          // Récupère la structure du dossier
          const structure = await invoke('read_directory_structure', {
            path: selectedPath
          });

          // Efface le contenu précédent
          resultContainer.innerHTML = '';
          // Crée la structure de fichiers/dossiers et l'ajoute au DOM
          const fileStructure = createFileStructure(structure);
          resultContainer.appendChild(fileStructure);
        }
      } catch (error) {
        console.error('Error:', error);
        resultContainer.textContent = `Error: ${error}`;
      }
    });
  }
});

/**
 * Crée l’élément racine qui contiendra la totalité de la structure
 */
function createFileStructure(structure: any): HTMLElement {
  const container = document.createElement('div');
  container.classList.add('file-structure');
  // Pour chaque élément (fichier ou dossier) à la racine
  for (const name in structure) {
    const itemElement = createItem(name, structure[name]);
    container.appendChild(itemElement);
  }
  return container;
}

/**
 * Crée un élément (fichier ou dossier) en fonction des données
 */
function createItem(name: string, itemData: any): HTMLElement {
  const itemElement = document.createElement('div');

  if (itemData.type === 'file') {
    // Création d'un fichier
    itemElement.classList.add('file-item');
    // On stocke le chemin dans un data attribute
    itemElement.setAttribute('data-path', itemData.path);

    // Ajout de l'icône (le chemin vers le SVG)
    const iconImg = document.createElement('img');
    iconImg.src = itemData.icon;
    iconImg.classList.add('file-icon');
    itemElement.appendChild(iconImg);

    // Ajout du nom du fichier
    const label = document.createElement('span');
    label.textContent = name;
    itemElement.appendChild(label);
  } else if (itemData.type === 'directory') {
    // Création d'un dossier
    itemElement.classList.add('folder-item');

    // Création d'un header pour le dossier (icône + nom)
    const header = document.createElement('div');
    header.classList.add('folder-header');

    // Replace SVG fetch with direct img element
    const iconImg = document.createElement('img');
    iconImg.src = itemData.icon;
    iconImg.classList.add('folder-icon');
    header.appendChild(iconImg);

    const label = document.createElement('span');
    label.textContent = name;
    header.appendChild(label);

    itemElement.appendChild(header);

    // Si le dossier contient des enfants, on les affiche dans un conteneur
    if (itemData.content) {
      const childrenContainer = document.createElement('div');
      childrenContainer.classList.add('folder-contents');
      // Parcours de chaque enfant dans le dossier
      for (const childName in itemData.content) {
        const childElement = createItem(childName, itemData.content[childName]);
        childrenContainer.appendChild(childElement);
      }
      itemElement.appendChild(childrenContainer);
    }
  }

  return itemElement;
}
