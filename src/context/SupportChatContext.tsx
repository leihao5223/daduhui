import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface SupportChatState {
  isOpen: boolean;
  prefillMessage: string;
  autoSend: boolean;
  openChat: () => void;
  closeChat: () => void;
  setPrefill: (message: string) => void;
  setAutoSend: (auto: boolean) => void;
}

const SupportChatContext = createContext<SupportChatState | null>(null);

export function SupportChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState('');
  const [autoSend, setAutoSend] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setPrefillMessage('');
    setAutoSend(false);
  }, []);

  const setPrefill = useCallback((message: string) => {
    setPrefillMessage(message);
  }, []);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener('open-support-chat', onOpen);
    return () => window.removeEventListener('open-support-chat', onOpen);
  }, []);

  return (
    <SupportChatContext.Provider
      value={{
        isOpen,
        prefillMessage,
        autoSend,
        openChat,
        closeChat,
        setPrefill,
        setAutoSend,
      }}
    >
      {children}
    </SupportChatContext.Provider>
  );
}

export function useSupportChat(): SupportChatState {
  const context = useContext(SupportChatContext);
  if (!context) {
    throw new Error('useSupportChat must be used within SupportChatProvider');
  }
  return context;
}
