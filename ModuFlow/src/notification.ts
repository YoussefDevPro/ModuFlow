export enum NotificationType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    LOADING = 'loading'
}

interface NotificationOptions {
    message: string;
    type: NotificationType;
    duration?: number;
    context?: string;
    onComplete?: () => void;
}

export class NotificationSystem {
    private static container: HTMLElement | null = null;
    private static queue: HTMLElement[] = [];
    private static maxNotifications: number = 5;

    public static initialize(): void {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    public static show(options: NotificationOptions): HTMLElement | void {
        this.initialize();
        
        const { message, type, duration = 6000, context, onComplete } = options;
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        
        switch (type) {
            case NotificationType.LOADING:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="8" cy="8" r="6"></circle>
                </svg>`;
                icon.classList.add('loading-spin');
                break;
            case NotificationType.SUCCESS:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 8l4 4 8-8"></path>
                </svg>`;
                break;
            case NotificationType.WARNING:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 1v8M8 12v1"></path>
                    <circle cx="8" cy="14" r="0.5" stroke="none" fill="currentColor"></circle>
                </svg>`;
                break;
            case NotificationType.ERROR:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 2l12 12M14 2L2 14"></path>
                </svg>`;
                break;
        }
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);
        
        if (context) {
            const contextEl = document.createElement('div');
            contextEl.className = 'notification-context';
            contextEl.textContent = context;
            content.appendChild(contextEl);
        }

        if (type === NotificationType.LOADING) {
            const progressBar = document.createElement('div');
            progressBar.className = 'notification-progress';
            notification.appendChild(progressBar);
        }
        
        notification.appendChild(icon);
        notification.appendChild(content);
        
        // Add close button for non-loading notifications
        if (type !== NotificationType.LOADING) {
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 2l12 12M14 2L2 14"></path>
            </svg>`;
            closeButton.addEventListener('click', () => {
                this.remove(notification);
            });
            notification.appendChild(closeButton);
        }
        
        if (this.container) {
            this.container.appendChild(notification);
            this.queue.push(notification);
            
            this.manageQueue();
            
            if (type !== NotificationType.LOADING && duration) {
                setTimeout(() => {
                    this.remove(notification);
                }, duration);
            }

            if (type === NotificationType.LOADING) {
                if (onComplete) {
                    onComplete();
                }
                return notification;
            }
        }
    }

    private static remove(notification: HTMLElement): void {
        // Don't remove loading notifications unless explicitly completed
        if (notification.classList.contains('notification-loading') && !notification.classList.contains('completed')) {
            return;
        }

        if (notification.parentNode) {
            notification.classList.add('removing');
            notification.addEventListener('animationend', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    this.queue = this.queue.filter(item => item !== notification);
                }
            });
        }
    }
    
    private static manageQueue(): void {
        while (this.queue.length > this.maxNotifications) {
            const oldest = this.queue[0];
            this.remove(oldest);
            this.queue.shift();
        }
    }
    
    public static success(message: string, context?: string): void {
        this.show({
            message,
            type: NotificationType.SUCCESS,
            context
        });
    }
    
    public static warning(message: string, context?: string): void {
        this.show({
            message,
            type: NotificationType.WARNING,
            context
        });
    }
    
    public static error(message: string, context?: string): void {
        this.show({
            message,
            type: NotificationType.ERROR,
            context
        });
    }
    
    public static loading(message: string, context?: string): HTMLElement {
        return this.show({
            message,
            type: NotificationType.LOADING,
            context,
            duration: 0
        }) as HTMLElement;
    }

    public static completeLoading(loadingNotification: HTMLElement | null, successMessage: string, context?: string): void {
        if (loadingNotification && loadingNotification.parentNode) {
            loadingNotification.classList.add('completed');
            this.remove(loadingNotification);
            this.success(successMessage, context);
        }
    }

    public static async executeWithLoading<T>(operation: () => Promise<T>, loadingMessage: string, successMessage: string, context?: string): Promise<T> {
        const loadingNotification = this.loading(loadingMessage, context);
        try {
            const result = await operation();
            this.completeLoading(loadingNotification, successMessage, context);
            return result;
        } catch (error) {
            this.remove(loadingNotification);
            this.error(error instanceof Error ? error.message : 'An error occurred', context);
            throw error;
        }
    }
}