import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';

//file icon : <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19 9V17.8C19 18.9201 19 19.4802 18.782 19.908C18.5903 20.2843 18.2843 20.5903 17.908 20.782C17.4802 21 16.9201 21 15.8 21H8.2C7.07989 21 6.51984 21 6.09202 20.782C5.71569 20.5903 5.40973 20.2843 5.21799 19.908C5 19.4802 5 18.9201 5 17.8V6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.0799 3 8.2 3H13M19 9L13 3M19 9H14C13.4477 9 13 8.55228 13 8V3" stroke="#b4befe " stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
// foder icon : <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke="#b4befe " stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>

const fileIconSvg = `<svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" id="file" class="icon glyph"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M19.41,7,15,2.59A2,2,0,0,0,13.59,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8.41A2,2,0,0,0,19.41,7Z"></path></g></svg>`;

// SVG pour un dossier
const folderIconSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M2 7c0-1.4 0-2.1.272-2.635a2.5 2.5 0 0 1 1.093-1.093C3.9 3 4.6 3 6 3h1.431c.94 0 1.409 0 1.835.13a3 3 0 0 1 1.033.552c.345.283.605.674 1.126 1.455L12 6h6c1.4 0 2.1 0 2.635.272a2.5 2.5 0 0 1 1.092 1.093C22 7.9 22 8.6 22 10v5c0 1.4 0 2.1-.273 2.635a2.5 2.5 0 0 1-1.092 1.092C20.1 19 19.4 19 18 19H6c-1.4 0-2.1 0-2.635-.273a2.5 2.5 0 0 1-1.093-1.092C2 17.1 2 16.4 2 15V7z" fill="currentColor"></path></g></svg>`;

async function selectDirectory() {
  try {
    const selected = await open({
      directory: true, // Forcer la sélection d'un dossier
      multiple: false, // Un seul dossier à la fois
    });

    if (selected && typeof selected === "string") {
      listFiles(selected);
    }
  } catch (error) {
    // Gestion d'erreur silencieuse
  }
}

async function listFiles(directory: string) {
  try {
    const files = await invoke("list_files", { directory });
    displayFiles(files);
  } catch (error) {
    // Gestion d'erreur silencieuse
  }
}

function displayFiles(files: any[], parentElement: HTMLElement | null = null) {
  // Si aucun conteneur n'est fourni, on récupère l'élément avec l'ID "file-list"
  if (!parentElement) {
    parentElement = document.querySelector("#file-list");
    if (!parentElement) return;
    parentElement.innerHTML = ""; // Nettoyer le conteneur
  }

  // Créer un élément <ul> pour la liste
  const ul = document.createElement("ul");
  parentElement.appendChild(ul);

  files.forEach((file) => {
    const li = document.createElement("li");

    if (file.is_dir) {
      li.className = "folder-item";

      // Créer le conteneur de l'icône et du nom
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.alignItems = "center";

      // Ajouter l'icône du dossier
      const folderIcon = document.createElement("span");
      folderIcon.innerHTML = folderIconSvg;
      folderIcon.style.marginRight = "5px";
      container.appendChild(folderIcon);

      // Création d'un élément <span> cliquable pour le nom du dossier
      const span = document.createElement("span");
      span.textContent = file.name;
      span.style.cursor = "pointer";
      container.appendChild(span);

      // Ajouter le conteneur au li
      li.appendChild(container);

      // Création de la sous-liste qui sera repliable
      const sublist = document.createElement("ul");
      sublist.style.display = "none"; // Masquer par défaut

      // Si le dossier contient des enfants, on les affiche récursivement dans sublist
      if (file.children && file.children.length > 0) {
        displayFiles(file.children, sublist);
      }

      // Au clic sur le <span>, on bascule l'affichage de la sous-liste
      span.addEventListener("click", (e) => {
        e.stopPropagation();
        sublist.style.display = sublist.style.display === "none" ? "block" : "none";
      });

      li.appendChild(sublist);
    } else {
      li.className = "file-item";
      // Créer le conteneur de l'icône et du nom
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.alignItems = "center";

      // Ajouter l'icône du fichier
      const fileIcon = document.createElement("span");
      fileIcon.innerHTML = fileIconSvg;
      fileIcon.style.marginRight = "5px";
      container.appendChild(fileIcon);

      // Ajouter le nom du fichier
      const textNode = document.createTextNode(file.name);
      container.appendChild(textNode);

      li.appendChild(container);
    }

    ul.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const btnFetch = document.querySelector<HTMLButtonElement>("#fetch-btn");
  btnFetch?.addEventListener("click", () => {
    selectDirectory();
  });
});