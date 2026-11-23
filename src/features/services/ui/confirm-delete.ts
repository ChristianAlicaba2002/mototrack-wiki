import type { ConfirmRequest } from '@/components/confirm-drawer';

export function deleteServiceRequest(onConfirm: () => void, serviceTitle?: string): ConfirmRequest {
  return {
    title: serviceTitle ? `Delete “${serviceTitle}”?` : 'Delete this service?',
    message: 'It will be removed from the service log. This can’t be undone.',
    confirmLabel: 'Delete entry',
    tone: 'danger',
    onConfirm,
  };
}
