import { Booking } from '@prisma/client';
import { forbiddenBookingError } from './errors';
import bookingRepository from '@/repositories/booking-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import hotelRepository from '@/repositories/hotel-repository';
import { notFoundError } from '@/errors';

async function findBooking(userId: number): Promise<Booking> {
  const booking = await bookingRepository.findBookingByUserId(userId);

  if (!booking) {
    throw notFoundError('No booking found for this user!');
  }

  return booking;
}

async function createBooking(roomId: number, userId: number): Promise<{ bookingId: number }> {
  const room = await hotelRepository.findRoomById(roomId);

  if (!room) {
    throw notFoundError('Room not found!');
  }

  const booking = await bookingRepository.findBookingByRoomId(roomId);

  if (booking) {
    throw forbiddenBookingError('Booking already exists!');
  }

  const enrollment = await enrollmentRepository.findByUserId(userId);

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

  const ticketType = await ticketsRepository.findTicketTypeById(ticket.ticketTypeId);

  if (ticket.status !== 'PAID' || ticketType.isRemote || !ticketType.includesHotel) {
    throw forbiddenBookingError('Verify if ticket is paid, presencial and includes hotel!');
  }

  const bookingId = await bookingRepository.createBooking(roomId, userId);

  return { bookingId };
}

const bookingService = { findBooking, createBooking };

export default bookingService;
