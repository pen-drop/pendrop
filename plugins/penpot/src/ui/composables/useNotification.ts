import { ref } from 'vue';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    message: string;
    type: NotificationType;
    duration?: number;
}

const show = ref(false);
const currentNotification = ref<Notification>({
    message: '',
    type: 'info',
    duration: 3000
});

export function useNotification() {
    const notify = (message: string, type: NotificationType = 'success', duration = 3000) => {
        currentNotification.value = { message, type, duration };
        show.value = true;
    };

    const success = (message: string, duration = 3000) => {
        notify(message, 'success', duration);
    };

    const error = (message: string, duration = 3000) => {
        notify(message, 'error', duration);
    };

    const info = (message: string, duration = 3000) => {
        notify(message, 'info', duration);
    };

    const warning = (message: string, duration = 3000) => {
        notify(message, 'warning', duration);
    };

    const hide = () => {
        show.value = false;
    };

    return {
        show,
        currentNotification,
        notify,
        success,
        error,
        info,
        warning,
        hide
    };
}
