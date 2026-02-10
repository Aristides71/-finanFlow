import React, { useState, useEffect } from 'react';
import { getTransactions, getBudgets } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, Share2, Mail, MessageCircle, X } from 'lucide-react';
import axios from '../services/api';

export default function Reports() {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    category: '',
    type: '',
    minAmount: '',
    maxAmount: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [budgetMap, setBudgetMap] = useState({});

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [txRes, budgetsRes] = await Promise.all([
        getTransactions(filters),
        getBudgets()
      ]);
      setTransactions(txRes.data);
      const overlaps = Array.isArray(budgetsRes.data)
        ? budgetsRes.data
            .filter(b => {
              const start = new Date(b.startDate);
              const end = new Date(b.endDate);
              const fStart = new Date(filters.startDate);
              const fEnd = new Date(filters.endDate);
              return start <= fEnd && end >= fStart;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      const active = overlaps[0] || null;
      const map = active ? Object.fromEntries((active.items || []).map(i => [i.category, i.allocatedAmount])) : {};
      setBudgetMap(map);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogoBase64 = async () => {
    try {
      const response = await fetch('/logo.png');
      if (!response.ok) throw new Error('Logo not found');
      const blob = await response.blob();
      const processed = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const opacityFactor = 0.4; // soften logo for PDF
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 245 && g > 245 && b > 245) {
              data[i + 3] = 0; // remove white background
            } else {
              data[i + 3] = Math.floor(data[i + 3] * opacityFactor); // reduce opacity
            }
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = URL.createObjectURL(blob);
      });
      if (processed) return processed;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err2) {
      console.warn("Logo loading failed, continuing without logo:", err2);
      return null;
    }
  };

  const generatePDFDoc = async () => {
    // Ensure jsPDF is initialized correctly
    const doc = new jsPDF();
    
    const logoBase64 = await getLogoBase64();
    let contentStartY = 30;

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 10, 39, 39);
        doc.setFontSize(18);
        doc.text('Relatório Financeiro', 85, 40);
        contentStartY = 59;
      } catch (imgError) {
        console.warn("Error adding image to PDF:", imgError);
        doc.setFontSize(18);
        doc.text('Relatório Financeiro', 14, 22);
        contentStartY = 30;
      }
    } else {
      doc.setFontSize(18);
      doc.text('Relatório Financeiro', 14, 22);
    }
    
    doc.setFontSize(11);
    doc.text(`Período: ${new Date(filters.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(filters.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`, 14, contentStartY);
    
    let filtersText = '';
    if (filters.category) filtersText += ` | Categoria: ${filters.category}`;
    if (filters.type) filtersText += ` | Tipo: ${filters.type === 'INCOME' ? 'Receita' : 'Despesa'}`;
    if (filters.minAmount) filtersText += ` | Min: R$ ${filters.minAmount}`;
    if (filters.maxAmount) filtersText += ` | Max: R$ ${filters.maxAmount}`;

    if (filtersText) {
      doc.setFontSize(10);
      doc.text(filtersText.substring(3), 14, contentStartY + 6);
      contentStartY += 6;
    }

    const tableColumn = ["Data", "Descrição", "Categoria", "Orçado", "Receita", "Despesa", "Saldo"];
    const tableRows = [];

    let currentBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    // Ensure transactions are sorted by date
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTransactions.forEach(t => {
      const isIncome = t.type === 'INCOME';
      const amount = Number(t.amount);
      
      if (isIncome) {
        currentBalance += amount;
        totalIncome += amount;
      } else {
        currentBalance -= amount;
        totalExpense += amount;
      }

      const budgeted = t.type === 'EXPENSE' && budgetMap[t.category] !== undefined
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(budgetMap[t.category]))
        : '-';
      const transactionData = [
        new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        t.description,
        t.category,
        budgeted,
        isIncome ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount) : '',
        !isIncome ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount) : '',
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBalance)
      ];
      tableRows.push(transactionData);
    });

    if (typeof autoTable !== 'function') {
      alert("Erro interno: Biblioteca de PDF (autoTable) não carregada corretamente.");
      throw new Error("autoTable not found");
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: contentStartY + 10,
      headStyles: { fillColor: [255, 102, 0] },
      columnStyles: {
        4: { halign: 'right', textColor: [22, 163, 74] },
        5: { halign: 'right', textColor: [220, 38, 38] },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Safely get finalY
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (contentStartY + 20);
    
    // Summary
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Receitas:`, 14, finalY + 10);
    doc.setTextColor(22, 163, 74); // Green
    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome), 50, finalY + 10);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Despesas:`, 14, finalY + 15);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense), 50, finalY + 15);

    // Final Balance Highlighted
    const balance = totalIncome - totalExpense;
    
    // Background rectangle for emphasis
    doc.setFillColor(240, 240, 240); // Light gray
    doc.rect(14, finalY + 18, 180, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Saldo Final do Período:`, 16, finalY + 24);
    
    if (balance >= 0) doc.setTextColor(37, 99, 235); // Blue
    else doc.setTextColor(220, 38, 38); // Red
    
    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance), 190, finalY + 24, { align: 'right' });

    return doc;
  };

  const exportPDF = async () => {
    try {
      const doc = await generatePDFDoc();
      doc.save(`relatorio_financeiro_${filters.startDate}_${filters.endDate}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const doc = await generatePDFDoc();
        const blob = doc.output('blob');
        const file = new File([blob], `relatorio_${filters.startDate}.pdf`, { type: "application/pdf" });
        
        await navigator.share({
          title: 'Relatório Financeiro',
          text: 'Segue o relatório financeiro.',
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Compartilhamento via Web Share API não suportado neste navegador. Use o botão WhatsApp ou Email.');
    }
  };

  const handleWhatsApp = () => {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      else totalExpense += t.amount;
    });
    const balance = totalIncome - totalExpense;
    
    const text = `*Relatório Financeiro*\nPeríodo: ${new Date(filters.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(filters.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}\n\nReceitas: R$ ${totalIncome.toFixed(2)}\nDespesas: R$ ${totalExpense.toFixed(2)}\nSaldo: R$ ${balance.toFixed(2)}`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSendingEmail(true);
    try {
      const doc = await generatePDFDoc();
      const blob = doc.output('blob');
      
      const formData = new FormData();
      formData.append('email', emailAddress);
      formData.append('subject', 'Relatório Financeiro');
      formData.append('report', blob, 'relatorio.pdf');
      
      await axios.post('/api/send-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Email enviado com sucesso!');
      setShowEmailModal(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erro ao enviar email.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Final</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoria</label>
            <input
              type="text"
              name="category"
              placeholder="Ex: Alimentação"
              value={filters.category}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            >
              <option value="">Todos</option>
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Mínimo</label>
            <input
              type="number"
              name="minAmount"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor Máximo</label>
            <input
              type="number"
              name="maxAmount"
              placeholder="0.00"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 border"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Gerar Relatório
          </button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Resultados</h2>
            <div className="flex gap-2">
              <button
                onClick={handleWhatsApp}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200 flex items-center gap-2"
                title="Enviar resumo via WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 flex items-center gap-2"
                title="Enviar PDF por Email"
              >
                <Mail className="w-5 h-5" />
                <span className="hidden sm:inline">Email</span>
              </button>
              <button
                onClick={handleShare}
                className="bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 transition duration-200 flex items-center gap-2"
                title="Compartilhar arquivo (Mobile)"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={exportPDF}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Orçado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-green-700 uppercase tracking-wider">Receita</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase tracking-wider">Despesa</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">Saldo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  let currentBalance = 0;
                  // Sort by date for display
                  const sortedForDisplay = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
                  
                  return sortedForDisplay.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    const amount = Number(t.amount);
                    if (isIncome) currentBalance += amount;
                    else currentBalance -= amount;
                    const budgeted = t.type === 'EXPENSE' && budgetMap[t.category] !== undefined
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(budgetMap[t.category]))
                      : '-';

                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {t.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {t.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                          {budgeted}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            Orçado: {t.type === 'EXPENSE' && budgetMap[t.category] !== undefined
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(budgetMap[t.category]))
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {isIncome ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                          {!isIncome ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount) : '-'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                          currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBalance)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                {(() => {
                  let totalIncome = 0;
                  let totalExpense = 0;
                  transactions.forEach(t => {
                    if (t.type === 'INCOME') totalIncome += Number(t.amount);
                    else totalExpense += Number(t.amount);
                  });
                  const finalBalance = totalIncome - totalExpense;
                  
                  return (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Saldo Final do Período
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-red-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                      </td>
                      <td className={`px-6 py-4 text-right text-base font-extrabold ${
                        finalBalance >= 0 ? 'text-blue-700' : 'text-red-700'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalBalance)}
                      </td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Enviar Relatório por Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de Destino</label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full border rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50 text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sendingEmail ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
