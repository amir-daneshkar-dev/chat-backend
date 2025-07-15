import React from "react";
import notificationService from "../../services/notification";

const NotificationTest: React.FC = () => {
    const testNotification = () => {
        notificationService.showChatNotification("Test User", "test-chat-id");
    };

    const requestPermission = () => {
        notificationService.requestPermission();
    };

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Notification Test</h3>
            <div className="space-y-2">
                <button
                    onClick={requestPermission}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Request Notification Permission
                </button>
                <button
                    onClick={testNotification}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Test Desktop Notification
                </button>
            </div>
        </div>
    );
};

export default NotificationTest;
