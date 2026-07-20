import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Wallet } from 'lucide-react';
import { api } from '../services/api';
import { getCurrentUser } from '../api/authService';

export function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const txnRef = searchParams.get('vnp_TxnRef');
  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const amountRaw = searchParams.get('vnp_Amount');
  const statusParam = searchParams.get('status');

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'FAILED' | 'CANCELLED' | 'ERROR'>('FAILED');
  const [message, setMessage] = useState('Checking transaction status...');
  const [amount, setAmount] = useState<number>(0);
  const pollCount = useRef(0);

  // Determine redirection path based on user role
  const getWalletPath = () => {
    if (!user) return '/login';
    const role = user.role?.toLowerCase();
    if (role === 'horseowner') return '/owner/wallet/overview';
    return '/spectator/wallet/overview';
  };

  useEffect(() => {
    // 1. Check for signature errors
    if (statusParam === 'invalid_signature') {
      setStatus('ERROR');
      setMessage('Giao dịch thất bại: Chữ ký số không hợp lệ hoặc dữ liệu bị can thiệp.');
      setLoading(false);
      return;
    }

    if (!txnRef) {
      setStatus('ERROR');
      setMessage('Yêu cầu không hợp lệ: Thiếu mã tham chiếu giao dịch.');
      setLoading(false);
      return;
    }

    // Parse amount
    if (amountRaw) {
      setAmount(parseFloat(amountRaw) / 100);
    }

    // 2. Map response codes
    if (responseCode === '24') {
      setStatus('CANCELLED');
      setMessage('Giao dịch đã bị hủy bỏ bởi khách hàng.');
      setLoading(false);
      return;
    }

    if (responseCode !== '00' || transactionStatus !== '00') {
      setStatus('FAILED');
      setMessage(`Giao dịch thất bại. Mã phản hồi: ${responseCode || 'N/A'}`);
      setLoading(false);
      return;
    }

    // 3. Start polling the backend for confirmation state
    let intervalId: any;

    const pollStatus = async () => {
      pollCount.current += 1;
      try {
        const res = await api.get(`/payments/vnpay/${txnRef}/status`);
        const txStatus = res?.status || res?.result?.status;

        if (txStatus === 'SUCCESS') {
          setStatus('SUCCESS');
          setMessage('Nạp tiền thành công! Số dư ví của bạn đã được cập nhật.');
          setLoading(false);
          clearInterval(intervalId);
        } else if (txStatus === 'FAILED') {
          setStatus('FAILED');
          setMessage('Nạp tiền thất bại. Vui lòng thử lại sau.');
          setLoading(false);
          clearInterval(intervalId);
        } else if (txStatus === 'CANCELLED') {
          setStatus('CANCELLED');
          setMessage('Giao dịch đã bị hủy.');
          setLoading(false);
          clearInterval(intervalId);
        } else if (pollCount.current > 15) {
          // Timeout after 30 seconds (15 polls * 2s)
          setStatus('ERROR');
          setMessage('Giao dịch đang được xử lý. Vui lòng kiểm tra lại ví của bạn sau vài phút.');
          setLoading(false);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error polling transaction status:', error);
        // Do not fail immediately on a single network error, continue polling
      }
    };

    // Initial check
    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => clearInterval(intervalId);
  }, [txnRef, responseCode, transactionStatus, amountRaw, statusParam]);

  return (
    <div className="min-h-screen text-body font-sans flex items-center justify-center p-4" style={{ backgroundColor: '#0B101E' }}>
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-gold-border/20 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
        
        {/* Upper gold accent line */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* State Icon */}
        <div className="mb-6">
          {loading ? (
            <div className="w-16 h-16 rounded-full bg-gold/5 border border-gold/25 flex items-center justify-center relative">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : status === 'SUCCESS' ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
          ) : status === 'CANCELLED' ? (
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <AlertCircle className="w-9 h-9 text-amber-400" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
              <XCircle className="w-9 h-9 text-red-400" />
            </div>
          )}
        </div>

        {/* Status text */}
        <h2 className="text-xl font-serif text-white mb-2">
          {loading ? 'Đang Xử Lý Giao Dịch' : status === 'SUCCESS' ? 'Nạp Tiền Thành Công' : 'Giao Dịch Thất Bại'}
        </h2>
        
        <p className="text-xs text-muted leading-relaxed mb-6 px-4">
          {message}
        </p>

        {/* Transaction details card */}
        {txnRef && (
          <div className="w-full bg-white/[0.02] border border-glass-border rounded-xl p-4 mb-8 text-left text-xs space-y-3">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-muted">Mã Giao Dịch:</span>
              <span className="font-semibold text-white truncate max-w-[200px]" title={txnRef}>{txnRef}</span>
            </div>
            {amount > 0 && (
              <div className="flex justify-between items-center py-0.5 border-t border-glass-border/40 pt-2.5">
                <span className="text-muted">Số Tiền Nạp:</span>
                <span className="font-bold text-gold">{amount.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
            <div className="flex justify-between items-center py-0.5 border-t border-glass-border/40 pt-2.5">
              <span className="text-muted">Phương Thức:</span>
              <span className="font-semibold text-white">VNPay Sandbox</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => navigate(getWalletPath())}
          className="w-full py-3.5 bg-gold hover:bg-gold-hover text-black rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-gold/15 hover:shadow-gold/25 transition-all duration-200 cursor-pointer"
        >
          <Wallet size={16} />
          Quay Lại Quản Lý Ví
        </button>
      </div>
    </div>
  );
}
