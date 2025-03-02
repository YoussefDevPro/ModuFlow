export enum NotificationType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

interface NotificationOptions {
    message: string;
    type: NotificationType;
    duration?: number;
    context?: string;
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

    public static show(options: NotificationOptions): void {
        this.initialize();
        
        const { message, type, duration = 12000, context } = options;
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        
        switch (type) {
            case NotificationType.SUCCESS:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 8l4 4 8-8"></path>
                </svg>`;
                break;
            case NotificationType.WARNING:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 1v10M8 14v1"></path>
                </svg>`;
                break;
            case NotificationType.ERROR:
                icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 1v10M8 14v1"></path>
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
        
        notification.appendChild(icon);
        notification.appendChild(content);
        
        if (this.container) {
            this.container.appendChild(notification);
            this.queue.push(notification);
            
            this.manageQueue();
            
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
    }
    
    private static remove(notification: HTMLElement): void {
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
}