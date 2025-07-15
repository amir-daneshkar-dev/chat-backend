class NotificationService {
    private hasPermission: boolean = false;

    constructor() {
        this.checkPermission();
    }

    private async checkPermission(): Promise<void> {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notifications");
            return;
        }

        if (Notification.permission === "granted") {
            this.hasPermission = true;
        } else if (Notification.permission === "denied") {
            this.hasPermission = false;
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!("Notification" in window)) {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === "granted";
            return this.hasPermission;
        } catch (error) {
            console.error("Failed to request notification permission:", error);
            return false;
        }
    }

    async showNotification(
        title: string,
        options: NotificationOptions = {}
    ): Promise<Notification | null> {
        if (!this.hasPermission) {
            const granted = await this.requestPermission();
            if (!granted) {
                return null;
            }
        }

        try {
            const notification = new Notification(title, {
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: "chat-notification",
                requireInteraction: false,
                silent: false,
                ...options,
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            return notification;
        } catch (error) {
            console.error("Failed to show notification:", error);
            return null;
        }
    }

    async showChatNotification(
        userName: string,
        chatId: string
    ): Promise<void> {
        const title = "New Chat Request";
        const body = `${userName} has started a new chat`;

        const notification = await this.showNotification(title, {
            body,
            data: { chatId },
        });

        if (notification) {
            notification.onclick = (event: Event) => {
                event.preventDefault();
                // Focus the window and trigger chat selection
                window.focus();
                // Dispatch custom event to be handled by the app
                window.dispatchEvent(
                    new CustomEvent("openChat", {
                        detail: { chatId },
                    })
                );
                notification.close();
            };
        }
    }

    isSupported(): boolean {
        return "Notification" in window;
    }

    getPermissionStatus(): NotificationPermission {
        if (!("Notification" in window)) {
            return "denied";
        }
        return Notification.permission;
    }
}

const notificationService = new NotificationService();
export default notificationService;
