import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import * as monaco from 'monaco-editor';

interface DirectoryItem {
    name: string;
    path: string;
    icon: string;
    is_dir: boolean;
    children?: DirectoryItem[];
    has_children: boolean;
}

interface EditorTab {
    path: string;
    name: string;
    icon: string;
    editor?: monaco.editor.IStandaloneCodeEditor;
    isModified: boolean;
}

let activeEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let openTabs: EditorTab[] = [];
let activeTabPath: string | null = null;

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
    if (activeEditor) {
      activeEditor.layout();
    }
  }
}

async function openFile(path: string, name: string, icon: string) {
    try {
        const content = await invoke<string>('read_file_content', { path });
        const existingTabIndex = openTabs.findIndex(tab => tab.path === path);

        if (existingTabIndex !== -1) {
            activateTab(existingTabIndex);
            return;
        }

        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        editorContainer.style.height = '100%';
        editorContainer.style.display = 'none';

        const editorElement = document.querySelector('.editor') as HTMLElement;
        editorElement.appendChild(editorContainer);

        const editor = monaco.editor.create(editorContainer, {
            value: content,
            language: getLanguageFromPath(path),
            theme: 'vs-dark',
            automaticLayout: true,
        });

        const newTab: EditorTab = { path, name, icon, editor, isModified: false };

        editor.onDidChangeModelContent(() => {
            const currentTabIndex = openTabs.findIndex(tab => tab.path === path);
            if (!newTab.isModified && currentTabIndex !== -1) {
                newTab.isModified = true;
                updateTabModifiedState(currentTabIndex);
            }
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            try {
                await invoke('save_file_content', { path, content: editor.getValue() });
                const currentTabIndex = openTabs.findIndex(tab => tab.path === path);
                if (currentTabIndex !== -1) {
                    newTab.isModified = false;
                    updateTabModifiedState(currentTabIndex);
                }
            } catch (error) {
                console.error('Error saving file:', error);
            }
        });
        openTabs.push(newTab);
        createTab(newTab, openTabs.length - 1);
        activateTab(openTabs.length - 1);
    } catch (error) {
        console.error('Error opening file:', error);
    }
}

function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
        'js': 'javascript',
        'ts': 'typescript',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'rs': 'rust',
        'py': 'python',
        'md': 'markdown',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'csharp': 'csharp',
        'go': 'go',
        'php': 'php',
        'ruby': 'ruby',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'scala': 'scala',
        'lua': 'lua',
        'bash': 'bash',
        'sh': 'shell',
        'yml': 'yaml',
        'toml': 'toml',
        'xml': 'xml',
        'sql': 'sql',
        'groovy': 'groovy',
        'haskell': 'haskell',
        'dart': 'dart',
        'elixir': 'elixir',
        'clojure': 'clojure',
        'fsharp': 'fsharp',
        'vhdl': 'vhdl',
        'verilog': 'verilog',
        'powershell': 'powershell',
        'r': 'r',
        'v': 'v',
        'ocaml': 'ocaml',
        'typescriptreact': 'typescriptreact',
        'javascriptreact': 'javascriptreact',
        'json5': 'json5',
        'markdown': 'markdown',
        'plain': 'plaintext'
    };
    // thx to chatgpt, i can focus on important things like the important things 
    return languageMap[ext || ''] || 'plaintext';
}

function createTab(tab: EditorTab, index: number) {
    const tabsContainer = document.querySelector('.editor-tabs') || createTabsContainer();
    const tabElement = document.createElement('div');
    tabElement.className = 'editor-tab';
    tabElement.setAttribute('data-path', tab.path);
    tabElement.innerHTML = `
        <img src="${tab.icon}" class="tab-icon" alt="file-icon"/>
        <span class="tab-name">${tab.name}</span>
        <button class="tab-close">
            <svg class="save-indicator" width="12" height="12" viewBox="0 0 12 12">
                <circle class="dot" cx="6" cy="6" r="3" fill="currentColor" style="display: none;"/>
                <path class="x" d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        </button>
    `;

    tabElement.addEventListener('click', async (e) => {
        if (!(e.target as HTMLElement).classList.contains('tab-close')) {
            const path = tabElement.getAttribute('data-path');
            if (path) {
                try {
                    const content = await invoke<string>('read_file_content', { path });
                    const tab = openTabs[index];
                    if (tab?.editor) {
                        tab.editor.setValue(content);
                    }
                    activateTab(index);
                } catch (error) {
                    console.error('Error reading file content:', error);
                }
            }
        }
    });

    tabElement.querySelector('.tab-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(index);
    });

    tabsContainer.appendChild(tabElement);
}

function createTabsContainer(): HTMLElement {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'editor-tabs';
    document.querySelector('.editor')?.prepend(tabsContainer);
    return tabsContainer;
}

function updateTabModifiedState(index: number) {
    const tab = document.querySelectorAll('.editor-tab')[index];
    const saveIndicator = tab?.querySelector('.save-indicator');
    if (saveIndicator) {
        const dot = saveIndicator.querySelector('.dot') as SVGElement;
        const x = saveIndicator.querySelector('.x') as SVGElement;
        if (openTabs[index].isModified) {
            dot.style.display = 'block';
            x.style.display = 'none';
        } else {
            dot.style.display = 'none';
            x.style.display = 'block';
        }
    }
}

function activateTab(index: number) {
    const tabs = document.querySelectorAll('.editor-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    tabs[index]?.classList.add('active');

    const containers = document.querySelectorAll('.editor-container');
    containers.forEach(container => (container as HTMLElement).style.display = 'none');

    const tab = openTabs[index];
    if (tab?.editor) {
        const container = tab.editor.getContainerDomNode();
        container.style.display = 'block';
        tab.editor.layout();
        activeEditor = tab.editor;
        activeTabPath = tab.path;
    }
}

function closeTab(index: number) {
    const tab = openTabs[index];
    if (tab.editor) {
        tab.editor.dispose();
        const container = tab.editor.getContainerDomNode();
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }

    openTabs.splice(index, 1);
    const tabs = document.querySelectorAll('.editor-tab');
    if (tabs[index]) {
        tabs[index].remove();
    }

    // Update all remaining tab indices
    const remainingTabs = document.querySelectorAll('.editor-tab');
    remainingTabs.forEach((tabElement, idx) => {
        const closeButton = tabElement.querySelector('.tab-close');
        if (closeButton) {
            const oldListener = closeButton.getAttribute('data-listener-index');
            if (oldListener) {
                closeButton.removeEventListener('click', () => closeTab(parseInt(oldListener)));
            }
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTab(idx);
            });
            closeButton.setAttribute('data-listener-index', idx.toString());
        }
    });

    if (openTabs.length > 0) {
        const newIndex = Math.min(index, openTabs.length - 1);
        activateTab(newIndex);
    } else {
        activeEditor = null;
        activeTabPath = null;
    }
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
            const fileItem = target.closest('.file-item');
            const folderHeader = target.closest('.folder-header');

            if (fileItem) {
                const path = fileItem.getAttribute('data-path');
                const name = fileItem.querySelector('span')?.textContent || '';
                const icon = fileItem.querySelector('img')?.getAttribute('src') || '';
                if (path) {
                    openFile(path, name, icon);
                }
            } else if (folderHeader) {
                const folderItem = folderHeader.closest('.folder-item') as HTMLElement;
                const contents = folderItem.querySelector('.folder-contents') as HTMLElement;
                
                if (contents) {
                    if (!contents.dataset.loaded) {
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
                    folderItem.classList.toggle('active');
                }
            }
        });
    }
});

function generateHtmlStructure(items: DirectoryItem[]): string {
    return items.map(item => {
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
                    <img src="${iconPath}" class="file-icon" alt="${iconPath}"/>
                    <span>${item.name}</span>
                </div>
            `;
        }
    }).join('');
}
