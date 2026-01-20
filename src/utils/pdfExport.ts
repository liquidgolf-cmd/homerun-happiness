import jsPDF from 'jspdf';
import { Message, Conversation } from '@/types/conversation';

export function downloadConversationPDF(
  messages: Message[],
  title: string,
  conversationInfo?: Partial<Conversation>
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkNewPage = (height: number) => {
    if (yPosition + height > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HomeRun to Happiness', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(16);
  doc.text(title, margin, yPosition);
  yPosition += 15;

  // Journey info if provided
  if (conversationInfo) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (conversationInfo.journey_type) {
      doc.text(`Journey Type: ${conversationInfo.journey_type}`, margin, yPosition);
      yPosition += 6;
    }
    if (conversationInfo.started_at) {
      const date = new Date(conversationInfo.started_at).toLocaleDateString();
      doc.text(`Started: ${date}`, margin, yPosition);
      yPosition += 10;
    }
  }

  // Add separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Messages
  messages.forEach((message) => {
    const isCoach = message.role === 'assistant';
    const timestamp = new Date(message.created_at).toLocaleString();

    // Check if we need a new page
    checkNewPage(30);

    // Timestamp
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(timestamp, margin, yPosition);
    yPosition += 5;

    // Sender label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    if (isCoach) {
      doc.setTextColor(37, 99, 235); // Blue
      doc.text('Coach:', margin, yPosition);
    } else {
      doc.setTextColor(16, 185, 129); // Green
      doc.text('You:', margin, yPosition);
    }
    yPosition += 6;

    // Message content
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(message.content, maxWidth);
    
    lines.forEach((line: string) => {
      checkNewPage(5);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 8; // Space between messages
  });

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function downloadFullJourneyPDF(
  conversation: Conversation,
  allMessages: Message[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkNewPage = (height: number) => {
    if (yPosition + height > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HomeRun to Happiness', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(18);
  doc.text('Your Complete Journey', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const summaryItems = [
    `Journey Type: ${conversation.journey_type || 'N/A'}`,
    `Started: ${new Date(conversation.started_at).toLocaleDateString()}`,
    `Progress: ${conversation.completion_percentage || 0}%`,
    `Total Messages: ${conversation.total_messages || 0}`,
  ];

  summaryItems.forEach(item => {
    checkNewPage(8);
    doc.text(item, margin, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Insights
  if (conversation.root_why || conversation.root_identity) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    checkNewPage(10);
    doc.text('Your Key Insights', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (conversation.root_why) {
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Your WHY:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const whyLines = doc.splitTextToSize(conversation.root_why, maxWidth);
      whyLines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 8;
    }

    if (conversation.root_identity) {
      checkNewPage(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Your Identity:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const identityLines = doc.splitTextToSize(conversation.root_identity, maxWidth);
      identityLines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 8;
    }
  }

  // New page for conversations
  doc.addPage();
  yPosition = margin;

  // Group messages by base
  const bases = ['at_bat', 'first_base', 'second_base', 'third_base', 'home_plate'];
  const baseLabels: Record<string, string> = {
    at_bat: 'At Bat - Discovering WHY',
    first_base: 'First Base - Discovering WHO',
    second_base: 'Second Base - Discovering WHAT',
    third_base: 'Third Base - Mapping HOW',
    home_plate: 'Home Plate - Why it MATTERS',
  };

  bases.forEach(baseStage => {
    const baseMessages = allMessages.filter(m => m.base_stage === baseStage);
    if (baseMessages.length === 0) return;

    // Base title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    checkNewPage(15);
    doc.text(baseLabels[baseStage] || baseStage, margin, yPosition);
    yPosition += 10;

    // Messages for this base
    baseMessages.forEach(message => {
      const isCoach = message.role === 'assistant';
      
      checkNewPage(20);

      // Sender
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      if (isCoach) {
        doc.setTextColor(37, 99, 235);
        doc.text('Coach:', margin, yPosition);
      } else {
        doc.setTextColor(16, 185, 129);
        doc.text('You:', margin, yPosition);
      }
      yPosition += 6;

      // Content
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(message.content, maxWidth);
      lines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      yPosition += 6;
    });

    yPosition += 10; // Extra space between bases
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `HomeRun_Complete_Journey_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}