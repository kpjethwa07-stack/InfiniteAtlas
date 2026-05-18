import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type Language = 'en' | 'fr' | 'es' | 'de' | 'it';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    myTrips: 'My Journeys',
    explore: 'Explore',
    profile: 'Profile',
    signOut: 'Sign Out',
    welcome: 'Hello',
    curiosity: 'Where will your curiosity lead you today?',
    smartPlan: 'Smart Plan',
    upcomingTrip: 'Upcoming Trip',
    noTrips: 'No trips planned',
    readyAdventure: 'Ready for adventure?',
    totalBudget: 'Total Planned Budget',
    acrossJourneys: 'Across {count} journeys',
    explorationStatus: 'Exploration Status',
    activeWayfarer: 'Active Wayfarer',
    recentPlans: 'Recent Plans',
    viewAll: 'View All',
    deleteTripConfirm: 'Are you certain you want to delete this journey? This action cannot be undone.',
    deleting: 'Deleting journey and all related data...',
    deleteSuccess: 'Journey removed from your records.',
    deleteError: 'Failed to remove journey.',
    identitySettings: 'Identity Settings',
    accountSecurity: 'Account & Security',
    language: 'Language',
    selectLanguage: 'Select your preferred language',
    saveChanges: 'Save Changes',
    discoverNewHorizons: 'Discover New Horizons',
    findNextStory: 'Find your next great story.',
    curatedDestinations: 'Curated destinations for the modern traveller.',
    whereToNext: 'Where to next?',
    backToExplore: 'Back to Explore',
    allCollections: 'All Collections',
    allCollectionsDesc: 'Our complete library of hand-picked destinations for every kind of adventure.',
    featuredCollections: 'Featured Collections',
    getaways: 'Getaways',
  },
  fr: {
    dashboard: 'Tableau de bord',
    myTrips: 'Mes Voyages',
    explore: 'Explorer',
    profile: 'Profil',
    signOut: 'Déconnexion',
    welcome: 'Bonjour',
    curiosity: 'Où votre curiosité vous mènera-t-elle aujourd\'hui ?',
    smartPlan: 'Plan Intelligent',
    upcomingTrip: 'Prochain Voyage',
    noTrips: 'Aucun voyage prévu',
    readyAdventure: 'Prêt pour l\'aventure ?',
    totalBudget: 'Budget Total Prévu',
    acrossJourneys: 'Sur {count} voyages',
    explorationStatus: 'Statut d\'exploration',
    activeWayfarer: 'Voyageur Actif',
    recentPlans: 'Plans Récents',
    viewAll: 'Tout Voir',
    deleteTripConfirm: 'Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible.',
    deleting: 'Suppression du voyage et de toutes les données associées...',
    deleteSuccess: 'Voyage supprimé de vos dossiers.',
    deleteError: 'Échec de la suppression du voyage.',
    identitySettings: 'Paramètres d\'identité',
    accountSecurity: 'Compte et Sécurité',
    language: 'Langue',
    selectLanguage: 'Choisissez votre langue préférée',
    saveChanges: 'Enregistrer les modifications',
    discoverNewHorizons: 'Découvrez de Nouveaux Horizons',
    findNextStory: 'Trouvez votre prochaine grande histoire.',
    curatedDestinations: 'Destinations curatées pour le voyageur moderne.',
    whereToNext: 'Où aller ensuite ?',
    backToExplore: 'Retour à l\'exploration',
    allCollections: 'Toutes les Collections',
    allCollectionsDesc: 'Notre bibliothèque complète de destinations triées sur le volet pour chaque type d\'aventure.',
    featuredCollections: 'Collections en vedette',
    getaways: 'Escapades',
  },
  es: {
    dashboard: 'Panel',
    myTrips: 'Mis Viajes',
    explore: 'Explorar',
    profile: 'Perfil',
    signOut: 'Cerrar Sesión',
    welcome: 'Hola',
    curiosity: '¿A dónde te llevará tu curiosidad hoy?',
    smartPlan: 'Plan Inteligente',
    upcomingTrip: 'Próximo Viaje',
    noTrips: 'No hay viajes planeados',
    readyAdventure: '¿Listo para la aventura?',
    totalBudget: 'Presupuesto Total Planeado',
    acrossJourneys: 'En {count} viajes',
    explorationStatus: 'Estado de Exploración',
    activeWayfarer: 'Caminante Activo',
    recentPlans: 'Planes Recientes',
    viewAll: 'Ver Todo',
    deleteTripConfirm: '¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.',
    deleting: 'Eliminando viaje y todos los datos relacionados...',
    deleteSuccess: 'Viaje eliminado de tus registros.',
    deleteError: 'Error al eliminar el viaje.',
    identitySettings: 'Ajustes de Identidad',
    accountSecurity: 'Cuenta y Seguridad',
    language: 'Idioma',
    selectLanguage: 'Selecciona tu idioma preferido',
    saveChanges: 'Guardar Cambios',
    discoverNewHorizons: 'Descubre Nuevos Horizontes',
    findNextStory: 'Encuentra tu próxima gran historia.',
    curatedDestinations: 'Destinos seleccionados para el viajero moderno.',
    whereToNext: '¿A dónde quieres ir?',
    backToExplore: 'Volver a Explorar',
    allCollections: 'Todas las Colecciones',
    allCollectionsDesc: 'Nuestra biblioteca completa de destinos seleccionados para cada tipo de aventura.',
    featuredCollections: 'Colecciones Destacadas',
    getaways: 'Escapadas',
  },
  de: {
    dashboard: 'Dashboard',
    myTrips: 'Meine Reisen',
    explore: 'Erkunden',
    profile: 'Profil',
    signOut: 'Abmelden',
    welcome: 'Guten Tag',
    curiosity: 'Wohin wird dich deine Neugier heute führen?',
    smartPlan: 'Smart-Planung',
    upcomingTrip: 'Anstehende Reise',
    noTrips: 'Keine Reisen geplant',
    readyAdventure: 'Bereit für ein Abenteuer?',
    totalBudget: 'Geplantes Gesamtbudget',
    acrossJourneys: 'Über {count} Reisen hinweg',
    explorationStatus: 'Explorationsstatus',
    activeWayfarer: 'Aktiver Weltenbummler',
    recentPlans: 'Aktuelle Pläne',
    viewAll: 'Alle anzeigen',
    deleteTripConfirm: 'Sind Sie sicher, dass Sie diese Reise löschen möchten? Dies kann nicht rückgängig gemacht werden.',
    deleting: 'Reise und alle zugehörigen Daten werden gelöscht...',
    deleteSuccess: 'Reise aus Ihren Unterlagen entfernt.',
    deleteError: 'Löschen der Reise fehlgeschlagen.',
    identitySettings: 'Identitätseinstellungen',
    accountSecurity: 'Konto & Sicherheit',
    language: 'Sprache',
    selectLanguage: 'Wählen Sie Ihre bevorzugte Sprache',
    saveChanges: 'Änderungen speichern',
    discoverNewHorizons: 'Entdecke neue Horizonte',
    findNextStory: 'Finde deine nächste große Geschichte.',
    curatedDestinations: 'Kuratierte Reiseziele für den modernen Reisenden.',
    whereToNext: 'Wohin als nächstes?',
    backToExplore: 'Zurück zum Erkunden',
    allCollections: 'Alle Sammlungen',
    allCollectionsDesc: 'Unsere komplette Bibliothek mit handverlesenen Reisezielen für jede Art von Abenteuer.',
    featuredCollections: 'Hervorgehobene Sammlungen',
    getaways: 'Kurzurlaube',
  },
  it: {
    dashboard: 'Dashboard',
    myTrips: 'I Miei Viaggi',
    explore: 'Esplora',
    profile: 'Profilo',
    signOut: 'Disconnetti',
    welcome: 'Buongiorno',
    curiosity: 'Dove ti porterà la tua curiosità oggi?',
    smartPlan: 'Piano Intelligente',
    upcomingTrip: 'Prossimo Viaggio',
    noTrips: 'Nessun viaggio pianificato',
    readyAdventure: 'Pronto per l\'avventura?',
    totalBudget: 'Budget Totale Pianificato',
    acrossJourneys: 'In {count} viaggi',
    explorationStatus: 'Stato di Esplorazione',
    activeWayfarer: 'Viaggiatore Attivo',
    recentPlans: 'Piani Recenti',
    viewAll: 'Vedi Tutto',
    deleteTripConfirm: 'Sei sicuro di voler eliminare questo viaggio? L\'azione è irreversibile.',
    deleting: 'Eliminazione del viaggio e di tutti i dati correlati...',
    deleteSuccess: 'Viaggio rimosso dai tuoi record.',
    deleteError: 'Impossibile rimuovere il viaggio.',
    identitySettings: 'Impostazioni Identità',
    accountSecurity: 'Account e Sicurezza',
    language: 'Lingua',
    selectLanguage: 'Seleziona la tua lingua preferita',
    saveChanges: 'Salva Modifiche',
    discoverNewHorizons: 'Scopri Nuovi Orizzonti',
    findNextStory: 'Trova la tua prossima grande storia.',
    curatedDestinations: 'Destinazioni curate per il viaggiatore moderno.',
    whereToNext: 'Qual è la prossima meta?',
    backToExplore: 'Torna ad Esplorare',
    allCollections: 'Tutte le Collezioni',
    allCollectionsDesc: 'La nostra libreria completa di destinazioni selezionate per ogni tipo di avventura.',
    featuredCollections: 'Collezioni in Primo Piano',
    getaways: 'Fughe',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    const fetchUserLanguage = async () => {
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().language) {
          setLang(userDoc.data().language as Language);
        }
      }
    };
    fetchUserLanguage();
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), {
        language: lang,
        updatedAt: new Date()
      });
    }
  };

  const t = (key: string) => {
    const translation = translations[language][key] || translations['en'][key] || key;
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
