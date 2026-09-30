import React, { useRef } from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReceiptModal({ receipt, onClose }) {
  const receiptRef = useRef();

  if (!receipt || !receipt.order) return null;

  const { order, change, amountPaid, settings } = receipt;
  const sym = settings?.currencySymbol || '$';
  const restaurantName = settings?.restaurantName || 'Restaurant POS';
  const address = settings?.address || '123 Gourmet Way, Food City';
  const phone = settings?.phone || '+1 234 567 890';
  const receiptFooter = settings?.receiptFooter || 'Thank you for dining with us!';

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 78mm;
              margin: 0 auto;
              padding: 10px;
              font-size: 12px;
              color: #000;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .dashed-line { border-bottom: 1px dashed #000; margin: 8px 0; }
            .double-line { border-bottom: 2px double #000; margin: 8px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 3px 0; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const orderDate = order.payment?.paidAt || order.createdAt || new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-green-50">
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle size={18} />
            <span>Payment Successful</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-green-100/50 rounded-lg p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Area with Thermal Receipt Look */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 flex justify-center">
          <div
            ref={receiptRef}
            className="w-full bg-white p-5 shadow-sm border border-gray-200 font-mono text-xs text-gray-800 rounded-sm space-y-3"
          >
            {/* Header */}
            <div className="text-center">
              <h2 className="text-base font-bold uppercase tracking-wider">{restaurantName}</h2>
              {address && <p className="text-[11px] text-gray-600 mt-0.5">{address}</p>}
              {phone && <p className="text-[11px] text-gray-600">Tel: {phone}</p>}
            </div>

            <div className="border-b border-dashed border-gray-400 my-2" />

            {/* Info details */}
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Order:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="capitalize font-semibold">{order.type} {order.table ? `(Table ${order.table?.number || order.table})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier:</span>
                <span>{order.cashier?.fullName || order.cashier?.username || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{format(new Date(orderDate), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-2" />

            {/* Items Table */}
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">ITEM</th>
                  <th className="text-center py-1">QTY</th>
                  <th className="text-right py-1">PRICE</th>
                  <th className="text-right py-1">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 text-left font-medium max-w-[110px] truncate">{item.name}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">{sym}{Number(item.price).toFixed(2)}</td>
                    <td className="py-1 text-right font-semibold">{sym}{Number(item.subtotal || (item.price * item.quantity)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-b border-dashed border-gray-400 my-2" />

            {/* Calculations */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{sym}{Number(order.subtotal || order.total).toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{sym}{Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-400 pt-1 my-1 flex justify-between font-bold text-sm text-gray-900">
                <span>TOTAL:</span>
                <span>{sym}{Number(order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Cash Paid:</span>
                <span>{sym}{Number(amountPaid || order.payment?.amountPaid || order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Change:</span>
                <span>{sym}{Number(change ?? order.payment?.change ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-gray-400 my-2" />

            {/* Footer */}
            <div className="text-center text-[11px] text-gray-600 pt-1 space-y-1">
              <p className="font-semibold">{receiptFooter}</p>
              <p className="text-[10px] text-gray-400">Powered by Offline RestoPOS</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
          <button
            onClick={handlePrint}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            <Printer size={16} /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2.5 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
