import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
const fileExplorer = document.querySelector('.file-explorer') as HTMLElement;
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
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
    const resultPre = document.querySelector<HTMLPreElement>('#result');

    if (selectDirBtn && resultPre) {
        selectDirBtn.addEventListener('click', async () => {
            try {
                const selectedPath = await open({
                    directory: true,
                    multiple: false
                });

                if (selectedPath) {
                    const structure = await invoke('read_directory_structure', {
                        path: selectedPath
                    });
                    
                    resultPre.textContent = JSON.stringify(structure, null, 2);
                }
            } catch (error) {
                console.error('Error:', error);
                resultPre.textContent = `Error: ${error}`;
            }
        });
    }
});
