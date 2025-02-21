import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';

async function selectDirectory() {
  try {
    const selected = await open({
      directory: true, // On force la sélection d'un dossier
      multiple: false, // Un seul dossier à la fois
    });

    if (selected && typeof selected === "string") {
      console.log("Dossier sélectionné :", selected);
      listFiles(selected);
    }
  } catch (error) {
    console.error("Erreur lors de la sélection du dossier :", error);
  }
}

async function listFiles(directory: string) {
  try {
    const files = await invoke("list_files", { directory });
    console.log("Fichiers récupérés :", files);
    displayFiles(files);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers :", error);
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

      // Création d'un élément <span> cliquable pour le nom du dossier
      const span = document.createElement("span");
      span.textContent = file.name;
      span.style.cursor = "pointer";

      // Création de la sous-liste qui sera repliable
      const sublist = document.createElement("ul");
      sublist.style.display = "none"; // Masquer par défaut

      // Si le dossier contient des enfants, on les affiche récursivement dans sublist
      if (file.children && file.children.length > 0) {
        displayFiles(file.children, sublist);
      }

      // Au clic sur le <span>, on bascule l'affichage de la sous-liste
      span.addEventListener("click", (e) => {
        e.stopPropagation(); // Empêche la propagation de l'événement
        sublist.style.display = sublist.style.display === "none" ? "block" : "none";
      });

      li.appendChild(span);
      li.appendChild(sublist);
    } else {
      li.className = "file-item";
      li.textContent = file.name;
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
