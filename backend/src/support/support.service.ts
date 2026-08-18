import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SupportTicket, SupportTicketDocument } from './schemas/support-ticket.schema';
import { EmailService } from '../common/email/email.service';

interface CreateTicketDto {
  userId?: string;
  senderEmail: string;
  senderName?: string;
  category: string;
  subject?: string;
  message: string;
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectModel(SupportTicket.name)
    private readonly ticketModel: Model<SupportTicketDocument>,
    private readonly emailService: EmailService,
  ) {}

  async createTicket(dto: CreateTicketDto) {
    const trimmedMessage = dto.message?.trim();
    if (!trimmedMessage) throw new BadRequestException('Message is required');

    const email = dto.senderEmail?.trim();
    if (!email) throw new BadRequestException('Sender email is required');

    // Generate unique Ticket Reference (e.g. MTP-849201)
    const ticketId = `MTP-${Math.floor(100000 + Math.random() * 900000)}`;

    const ticket = await this.ticketModel.create({
      ticketId,
      userId: dto.userId && Types.ObjectId.isValid(dto.userId) ? new Types.ObjectId(dto.userId) : undefined,
      senderEmail: email,
      senderName: dto.senderName?.trim() || 'MT Pocket Member',
      category: dto.category || 'General Inquiry',
      subject: dto.subject?.trim() || dto.category || 'Support Inquiry',
      message: trimmedMessage,
      status: 'open',
      priority: dto.category?.toLowerCase().includes('scam') || dto.category?.toLowerCase().includes('report') ? 'high' : 'normal',
    });

    // Send emails via Resend API (Async & Non-blocking)
    this.sendResendNotifications(ticket).catch((err) => {
      this.logger.warn(`Resend dispatch warning: ${err.message}`);
    });

    return ticket;
  }

  // List all tickets for Admin Dashboard
  async listTickets({
    status,
    category,
    page = 1,
    limit = 20,
  }: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const query: Record<string, any> = {};
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.ticketModel.countDocuments(query),
    ]);

    return {
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get tickets submitted by a specific user
  async getMyTickets(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) return [];
    return this.ticketModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Update ticket status or resolution notes (Admin)
  async updateTicketStatus(
    id: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    adminNotes?: string,
  ) {
    const ticket = await this.ticketModel.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = status;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    return ticket;
  }

  // ── RESEND NOTIFICATIONS via existing EmailService ───────────────────
  private async sendResendNotifications(ticket: SupportTicketDocument) {
    const adminEmail = process.env.SUPPORT_EMAIL || 'support@mtpocket.com';

    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/hyztwkou/image/upload/v1787051288/logo_pvvfwz.png" alt="MT Pocket Logo" style="height: 48px; width: auto; display: inline-block;" />
        </div>
        <h2 style="color: #059669; text-align: center; margin-top: 0;">New Support Ticket Received</h2>
        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
        <p><strong>From:</strong> ${ticket.senderName} (${ticket.senderEmail})</p>
        <p><strong>Topic:</strong> ${ticket.category}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${ticket.priority === 'high' ? '#dc2626' : '#2563eb'}">${ticket.priority}</span></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px; line-height: 1.5; color: #334155;">
          ${ticket.message.replace(/\n/g, '<br />')}
        </div>
      </div>
    `;

    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/hyztwkou/image/upload/v1787051288/logo_pvvfwz.png" alt="MT Pocket Logo" style="height: 48px; width: auto; display: inline-block;" />
        </div>
        <h2 style="color: #059669; text-align: center; margin-top: 0;">We Received Your Support Request</h2>
        <p>Hello <strong>${ticket.senderName}</strong>,</p>
        <p>Thank you for reaching out to MT Pocket. We have received your inquiry and created support ticket <strong>${ticket.ticketId}</strong>.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin: 15px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Subject:</strong> ${ticket.subject}</p>
          <p style="margin: 5px 0 0; font-size: 13px; color: #475569;">Our compliance team will review your case and get back to you within 24 hours.</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">If you need to add more details, reply directly to this email with reference <strong>${ticket.ticketId}</strong>.</p>
      </div>
    `;

    await Promise.allSettled([
      this.emailService.sendMail(
        adminEmail,
        `[Support Ticket ${ticket.ticketId}] ${ticket.subject}`,
        adminEmailHtml,
      ),
      this.emailService.sendMail(
        ticket.senderEmail,
        `[Ticket Received] ${ticket.ticketId}: ${ticket.subject}`,
        userEmailHtml,
      ),
    ]);
  }
}
