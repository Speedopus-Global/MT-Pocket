import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { MessageCircle, Loader2 } from 'lucide-react';

// Drop this next to each offer row wherever offers are listed:
//
//   Borrower's own request page (their request's offer list):
//     <MessageButton loanRequestId={request._id} lenderId={offer.lenderId} />
//
//   Lender's "My offers sent" page (api.getMyOffersSent()):
//     <MessageButton loanRequestId={offer.loanRequestId} lenderId={user.id} />
//     (the lender IS the lenderId here — getOrCreateConversation() allows
//     the named lender to open their own thread, same as the borrower)
//
// Works for both sides because chat.service.ts's getOrCreateConversation()
// accepts either the request's borrower or the named lender as the caller.
export default function MessageButton({ loanRequestId, lenderId, className = '' }) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const openChat = async () => {
    setLoading(true);
    try {
      const convo = await api.getOrCreateChatConversation(loanRequestId, lenderId, accessToken);
      navigate(`/dashboard/messages?conversationId=${convo._id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openChat}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 text-primary text-sm font-bold px-3.5 py-2 hover:bg-primary/10 transition-colors disabled:opacity-60 cursor-pointer ${className}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
      Message
    </button>
  );
}