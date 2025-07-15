import React from "react";
import { Bell } from "lucide-react";

interface NotificationDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    isOpen,
    onToggle,
    onClose,
}) => {
    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isOpen && !target.closest(".notification-dropdown")) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative notification-dropdown">
            <button
                onClick={onToggle}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors relative"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Notifications
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="text-center py-8">
                            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium mb-2">
                                Coming Soon!
                            </p>
                            <p className="text-sm text-gray-500">
                                Notification features are currently under
                                development.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
