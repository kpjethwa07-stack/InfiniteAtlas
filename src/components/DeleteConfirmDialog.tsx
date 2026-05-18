import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description 
}: DeleteConfirmDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[32px] sm:max-w-md p-8 border-none shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {title || t('deleteTripConfirm')}
          </DialogTitle>
          <DialogDescription className="text-black/50 text-base leading-relaxed">
            {description || 'This action is permanent and cannot be undone. All itinerary data, expenses, and notes will be lost.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8 flex gap-3 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-full px-6 font-semibold"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-full px-8 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
