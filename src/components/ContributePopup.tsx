import React from 'react';
import { X, Github } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface ContributePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContributePopup({ isOpen, onClose }: ContributePopupProps) {
  const handleDoNotShowAgain = () => {
    localStorage.setItem('hideContributePopup', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Contribuez au projet !
            </Dialog.Title>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-4 text-gray-600">
            <p className="mb-4">
              Ce projet est open source et nous accueillons toutes les contributions ! 
              Vous pouvez nous aider à améliorer l'application en :
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Signalant des bugs</li>
              <li>Proposant de nouvelles fonctionnalités</li>
              <li>Améliorant la documentation</li>
              <li>Soumettant des pull requests</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <a
              href="https://github.com/gh-Constant/IUT-homework"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#24292F] text-white rounded-lg hover:bg-[#24292F]/90 transition-colors"
            >
              <Github className="h-5 w-5" />
              Voir sur GitHub
            </a>
            
            <button
              onClick={handleDoNotShowAgain}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              Ne plus afficher 😢
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 