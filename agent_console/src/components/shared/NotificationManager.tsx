import React from "react";
import NotificationToast from "./NotificationToast";

interface Notification {
    id: string;
    title: string;
    message: string;
    userName: string;
    chatId: string;
    timestamp: number;
}

interface NotificationManagerProps {
    notifications: Notification[];
    onClose: (id: string) => void;
    onClick: (chatId: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
    notifications,
    onClose,
    onClick,
}) => {
    return (
        <div className="fixed top-4 right-4 z-50">
            {notifications.map((notification, index) => (
                <div
                    key={notification.id}
                    className="mb-2"
                    style={{
                        transform: `translateY(${index * 90}px)`,
                    }}
                >
                    <NotificationToast
                        id={notification.id}
                        title={notification.title}
                        message={notification.message}
                        userName={notification.userName}
                        chatId={notification.chatId}
                        onClose={onClose}
                        onClick={onClick}
                        duration={5000}
                    />
                </div>
            ))}
        </div>
    );
};

export default NotificationManager;
