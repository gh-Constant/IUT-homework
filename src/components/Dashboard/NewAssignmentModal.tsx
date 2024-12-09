import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Subject, Category, TargetType, User } from '../../types/index';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface NewAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAssignmentCreated: () => void;
}

interface Link {
  url: string;
  title: string;
}

export default function NewAssignmentModal({
  isOpen,
  onClose,
  currentUser,
  onAssignmentCreated,
}: NewAssignmentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<Subject>('Communication');
  const [dueDate, setDueDate] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('global');
  const [targetGroups, setTargetGroups] = useState<Category[]>([]);
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [currentLink, setCurrentLink] = useState({ url: '', title: '' });

  const subjects: Subject[] = [
    'Communication',
    'SAE',
    'Anglais',
    'Informatique',
    'Management',
    'Marketing',
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, category, created_at');
      
      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  const handleAddLink = () => {
    if (!currentLink.url || !currentLink.title) {
      toast.error('Veuillez remplir le titre et l\'URL');
      return;
    }

    try {
      new URL(currentLink.url); // Validate URL format
      setLinks([...links, currentLink]);
      setCurrentLink({ url: '', title: '' }); // Reset form
    } catch (error) {
      toast.error('URL invalide');
    }
  };

  const removeLink = (indexToRemove: number) => {
    setLinks(links.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          title,
          description,
          subject,
          due_date: dueDate,
          target_type: targetType,
          target_groups: targetType === 'group' ? targetGroups : [],
          target_users: targetType === 'personal' ? targetUsers : [],
          created_by: currentUser.id,
          links: links,
        });

      if (error) throw error;

      toast.success('Devoir créé avec succès');
      onAssignmentCreated();
      onClose();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Erreur lors de la création du devoir');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm dark:bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Nouveau devoir
            </Dialog.Title>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
  
          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Titre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Entrez le titre du devoir"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
  
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                  <ReactQuill
                    value={description}
                    onChange={setDescription}
                    className="bg-white dark:bg-gray-700"
                    theme="snow"
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['link'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'bold', 'italic', 'underline', 'strike',
                      'link', 'list', 'bullet'
                    ]}
                    placeholder="Décrivez le devoir en détail"
                  />
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Matière
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
  
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date limite
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
  
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type de cible
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['global', 'personal', 'group'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTargetType(type as TargetType)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        targetType === type
                          ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type === 'global' ? 'Tout le monde' : type === 'personal' ? 'Personnel' : 'Groupes'}
                    </button>
                  ))}
                </div>
              </div>
  
              {targetType === 'group' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Groupes cibles
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['C2', 'C1', 'B2', 'B1', 'A2', 'A1'].map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setTargetGroups(prev => 
                            prev.includes(group as Category)
                              ? prev.filter(g => g !== group)
                              : [...prev, group as Category]
                          )
                        }}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          targetGroups.includes(group as Category)
                            ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>
              )}
  
              {targetType === 'personal' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Utilisateurs cibles
                  </label>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
                    {users.map(user => (
                      <label
                        key={user.id}
                        className={`flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          targetUsers.includes(user.id) ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={targetUsers.includes(user.id)}
                          onChange={(e) => {
                            setTargetUsers(prev =>
                              e.target.checked
                                ? [...prev, user.id]
                                : prev.filter(id => id !== user.id)
                            )
                          }}
                          className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{user.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
  
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Liens utiles
                </label>
                
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <input
                      type="text"
                      placeholder="Titre du lien"
                      value={currentLink.title}
                      onChange={(e) => setCurrentLink(prev => ({ ...prev, title: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-800 dark:text-gray-100"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={currentLink.url}
                        onChange={(e) => setCurrentLink(prev => ({ ...prev, url: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-800 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                  {links.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800">
                      {links.map((link, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 group"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-300">{link.title}</span>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary dark:text-indigo-300 hover:underline"
                            >
                              {link.url}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLink(index)}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
  
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Créer le devoir
              </button>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
