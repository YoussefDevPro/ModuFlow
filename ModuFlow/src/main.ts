import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import * as monaco from 'monaco-editor';
import { NotificationSystem, NotificationType } from './notification';

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
const editor = document.querySelector('.editor') as HTMLElement;
let isResizing = false;
let hasResized = false;
let initialWidth = 0;

resizeHandle.addEventListener('mousedown', (e) => {
  e.preventDefault(); // Prevent text selection during drag
  isResizing = true;
  hasResized = false;
  initialWidth = fileExplorer.offsetWidth;
  
  // Add visual feedback classes
  document.body.classList.add('resizing');
  resizeHandle.classList.add('active');
  fileExplorer.classList.add('resizing');
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

function handleMouseUp() {
  if (isResizing) {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Remove visual feedback classes
    document.body.classList.remove('resizing');
    resizeHandle.classList.remove('active');
    fileExplorer.classList.remove('resizing');
    
    // Only show notification if actual resizing occurred
    if (hasResized) {
      NotificationSystem.success('Resize completed', 'UI Event');
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isResizing) return;
  
  const newWidth = Math.max(200, Math.min(e.clientX, window.innerWidth * 0.8));
  
  // Check if width actually changed
  if (Math.abs(newWidth - fileExplorer.offsetWidth) > 1) {
    hasResized = true;
    fileExplorer.style.width = `${newWidth}px`;
    
    // Update editor layout if active
    if (activeEditor) {
      activeEditor.layout();
    }
  }
}

async function openFile(path: string, name: string, icon: string) {
    try {
        NotificationSystem.warning('Opening file...', `File: ${name}`);
        const content = await invoke<string>('read_file_content', { path });
        const existingTabIndex = openTabs.findIndex(tab => tab.path === path);

        if (existingTabIndex !== -1) {
            NotificationSystem.success('Activating existing tab', `File: ${name}`);
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
            if (currentTabIndex !== -1) {
                newTab.isModified = true;
                updateTabModifiedState(currentTabIndex);
                NotificationSystem.warning('File modified', `File: ${name}`);
            }
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            try {
                NotificationSystem.warning('Saving file...', `File: ${name}`);
                await invoke('save_file_content', { path, content: editor.getValue() });
                const currentTabIndex = openTabs.findIndex(tab => tab.path === path);
                if (currentTabIndex !== -1) {
                    newTab.isModified = false;
                    updateTabModifiedState(currentTabIndex);
                    NotificationSystem.success('File saved', `File: ${name}`);
                }
            } catch (error) {
                console.error('Error saving file:', error);
                NotificationSystem.error('Error saving file', `File: ${name}`);
            }
        });
        openTabs.push(newTab);
        createTab(newTab, openTabs.length - 1);
        activateTab(openTabs.length - 1);
        NotificationSystem.success('File opened successfully', `File: ${name}`);
    } catch (error) {
        console.error('Error opening file:', error);
        NotificationSystem.error('Error opening file', `File: ${name}`);
    }
}

function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
        'js': 'javascript',
        'jsx': 'javascriptreact',
        'ts': 'typescript',
        'tsx': 'typescriptreact',
        'json': 'json',
        'json5': 'json5',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'xml': 'xml',
        'yml': 'yaml',
        'yaml': 'yaml',
        'toml': 'toml',
        'ini': 'ini',
        'c': 'c',
        'cpp': 'cpp',
        'csharp': 'csharp',
        'vb': 'vb',
        'java': 'java',
        'go': 'go',
        'rs': 'rust',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'scala': 'scala',
        'dart': 'dart',
        'py': 'python',
        'rb': 'ruby',
        'ruby': 'ruby',
        'php': 'php',
        'perl': 'perl',
        'lua': 'lua',
        'r': 'r',
        'mat': 'matlab',
        'sh': 'shell',
        'bash': 'bash',
        'bat': 'bat',
        'ps1': 'powershell',
        'powershell': 'powershell',
        'md': 'markdown',
        'markdown': 'markdown',
        'plain': 'plaintext',
        'txt': 'plaintext',
        'groovy': 'groovy',
        'haskell': 'haskell',
        'elixir': 'elixir',
        'clojure': 'clojure',
        'fsharp': 'fsharp',
        'vhdl': 'vhdl',
        'verilog': 'verilog',
        'ocaml': 'ocaml',
        'handlebars': 'handlebars',
        'dockerfile': 'dockerfile',
        'coffeescript': 'coffeescript',
        'coffee': 'coffeescript',
        'msdax': 'msdax',
        'mysql': 'mysql',
        'sol': 'solidity',
        'solidity': 'solidity',
        'apex': 'apex',
        'abap': 'abap',
        'elm': 'elm',
        'erlang': 'erlang',
        'julia': 'julia',
        'svelte': 'svelte',
        'objc': 'objective-c',
        'objectivec': 'objective-c',
        'pas': 'pascal',
        'pascal': 'pascal'
      };
    // thx to chatgpt, i can focus on important things like the important things 
    NotificationSystem.success('Language detected', `Language: ${languageMap[ext || ''] || 'plaintext'}`);
    return languageMap[ext || ''] || 'plaintext';
}

function createTab(tab: EditorTab, index: number) {
    NotificationSystem.warning('Creating tab', `Tab: ${tab.name}`);
    const tabsContainer = document.querySelector('.editor-tabs') || createTabsContainer();
    const tabElement = document.createElement('div');
    tabElement.className = 'editor-tab';
    tabElement.setAttribute('data-path', tab.path);
    tabElement.innerHTML = `
        <img src="${tab.icon}" class="tab-icon" alt="file-icon"/>
        <span class="tab-name">${tab.name}</span>
        <button class="tab-close">
            <svg class="save-indicator" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z"></path></g></svg>
        </button>
    `;

    tabElement.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).classList.contains('tab-close')) {
            activateTab(index);
        }
    });

    tabElement.querySelector('.tab-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(index);
    });

    tabElement.querySelector('.tab-save')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tab = openTabs[index];
        if (tab?.editor) {
            try {
                NotificationSystem.warning('Saving file...', `File: ${tab.name}`);
                await invoke('save_file_content', { path: tab.path, content: tab.editor.getValue() });
                tab.isModified = false;
                updateTabModifiedState(index);
                NotificationSystem.success('File saved', `File: ${tab.name}`);
            } catch (error) {
                console.error('Error saving file:', error);
                NotificationSystem.error('Error saving file', `File: ${tab.name}`);
            }
        }
    });

    tabsContainer.appendChild(tabElement);
    NotificationSystem.success('Tab created', `Tab: ${tab.name}`);
}

function createTabsContainer(): HTMLElement {
    NotificationSystem.warning('Creating tabs container', 'UI Component');
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'editor-tabs';
    document.querySelector('.editor')?.prepend(tabsContainer);
    NotificationSystem.success('Tabs container created', 'UI Component');
    return tabsContainer;
}

function updateTabModifiedState(index: number) {
    const tab = document.querySelectorAll('.editor-tab')[index];
    const saveIndicator = tab?.querySelector('.save-indicator');
    if (saveIndicator) {
        if (openTabs[index].isModified) {
            // Show a filled circle for modified files
            saveIndicator.innerHTML = `
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="6" fill="#ffffff"/>
                </svg>
            `;
            NotificationSystem.warning('Tab marked as modified', `Tab: ${openTabs[index].name}`);
        } else {
            // Show a checkmark for saved files
            saveIndicator.innerHTML = `
                <svg class="save-indicator" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path fill="#ffffff" d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z"></path></g>
                </svg>
            `;
            NotificationSystem.success('Tab marked as saved', `Tab: ${openTabs[index].name}`);
        }
    }
}

function activateTab(index: number) {
    NotificationSystem.warning('Activating tab', `Tab: ${openTabs[index]?.name || 'Unknown'}`);
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
        NotificationSystem.success('Tab activated', `Tab: ${tab.name}`);
    }
}

function closeTab(index: number) {
    const tab = openTabs[index];
    NotificationSystem.warning('Closing tab', `Tab: ${tab.name}`);
    
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
    // Initialize notification system
    NotificationSystem.initialize();
    NotificationSystem.success('ModuFlow Editor initialized', 'Application');
    
    const selectDirBtn = document.querySelector<HTMLButtonElement>('#selectDir');
    const resultContainer = document.querySelector<HTMLDivElement>('#result');
    
    if (selectDirBtn && resultContainer) {
        selectDirBtn.addEventListener('click', async () => {
            try {
                NotificationSystem.warning('Opening folder dialog...', 'File System');
                const selectedPath = await open({
                    directory: true,
                    multiple: false
                });

                if (selectedPath) {
                    NotificationSystem.warning('Reading directory structure...', `Path: ${selectedPath}`);
                    const directoryItems = await invoke<DirectoryItem[]>('read_directory_structure', {
                        path: selectedPath,
                        depth: 1
                    });

                    resultContainer.innerHTML = generateHtmlStructure(directoryItems);
                    NotificationSystem.success('Directory loaded', `Path: ${selectedPath}`);
                } else {
                    NotificationSystem.warning('Folder selection cancelled', 'File System');
                }
            } catch (error) {
                console.error('Error:', error);
                resultContainer.textContent = `Error: ${error}`;
                NotificationSystem.error('Failed to load directory', `Error: ${error}`);
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
                                NotificationSystem.warning('Loading folder contents...', `Folder: ${folderItem.querySelector('span')?.textContent || ''}`);
                                const items = await invoke<DirectoryItem[]>('read_directory_contents', { path });
                                contents.innerHTML = generateHtmlStructure(items);
                                contents.dataset.loaded = 'true';
                                NotificationSystem.success('Folder contents loaded', `Folder: ${folderItem.querySelector('span')?.textContent || ''}`);
                            }
                        } catch (error) {
                            console.error('Error loading contents:', error);
                            NotificationSystem.error('Failed to load folder contents', `Error: ${error}`);
                        }
                    }
                    folderItem.classList.toggle('active');
                    NotificationSystem.success('Folder toggled', `Folder: ${folderItem.querySelector('span')?.textContent || ''}`);
                }
            }
        });
    }
});

function generateHtmlStructure(items: DirectoryItem[]): string {
    NotificationSystem.warning('Generating HTML structure', `Items: ${items.length}`);
    const html = items.map(item => {
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
    NotificationSystem.success('HTML structure generated', `Items: ${items.length}`);
    return html;
}
