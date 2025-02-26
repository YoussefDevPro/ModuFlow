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

interface DirectoryItem {
    name: string;
    path: string;
    icon: string;
    is_dir: boolean;
    children?: DirectoryItem[];
    has_children: boolean;
}

document.addEventListener('DOMContentLoaded', () => {
    const selectDirBtn = document.querySelector<HTMLButtonElement>('#selectDir');
    const resultContainer = document.querySelector<HTMLDivElement>('#result');
    
    if (selectDirBtn && resultContainer) {
        selectDirBtn.addEventListener('click', async () => {
            try {
                const selectedPath = await open({
                    directory: true,
                    multiple: false
                });

                if (selectedPath) {
                    const directoryItems = await invoke<DirectoryItem[]>('read_directory_structure', {
                        path: selectedPath,
                        depth: 1
                    });

                    resultContainer.innerHTML = generateHtmlStructure(directoryItems);
                }
            } catch (error) {
                console.error('Error:', error);
                resultContainer.textContent = `Error: ${error}`;
            }
        });

        resultContainer.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('folder-header') || target.closest('.folder-header')) {
                const header = target.closest('.folder-header') as HTMLElement;
                const folderItem = header.closest('.folder-item') as HTMLElement;
                const contents = folderItem.querySelector('.folder-contents') as HTMLElement;
                
                if (contents) {
                    const isExpanded = folderItem.classList.contains('expanded');
                    
                    if (!isExpanded && !contents.dataset.loaded) {
                        try {
                            const path = folderItem.dataset.path;
                            if (path) {
                                const items = await invoke<DirectoryItem[]>('read_directory_contents', { path });
                                contents.innerHTML = generateHtmlStructure(items);
                                contents.dataset.loaded = 'true';
                            }
                        } catch (error) {
                            console.error('Error loading contents:', error);
                        }
                    }
                    
                    contents.classList.toggle('hidden');
                    folderItem.classList.toggle('expanded');
                }
            }
        });
    }

    function generateHtmlStructure(items: DirectoryItem[]): string {
        return items.map(item => {
            // Convert the asset path to a proper URL that Tauri can handle
            const iconPath = `/${item.icon.replace(/\\/g, '/')}`;
            
            if (item.is_dir) {
                return `
                    <div class="folder-item" data-path="${item.path}">
                        <div class="folder-header">
                            <img src="${iconPath}" class="folder-icon" alt="folder"/>
                            <span>${item.name}</span>
                            ${item.has_children ? '<span class="expand-indicator">▶</span>' : ''}
                        </div>
                        <div class="folder-contents hidden"></div>
                    </div>
                `;
            } else {
                return `
                    <div class="file-item" data-path="${item.path}">
                        <img src="${iconPath}" class="file-icon" alt="file"/>
                        <span>${item.name}</span>
                    </div>
                `;
            }
        }).join('');
    }
});