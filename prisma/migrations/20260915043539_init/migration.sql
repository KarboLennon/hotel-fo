-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "Title" AS ENUM ('MR', 'MRS', 'DR', 'MISS');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('KTP', 'SIM', 'PASSPORT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('REGULAR', 'REPEAT', 'VIP');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'VOID');

-- CreateEnum
CREATE TYPE "SettlementMethod" AS ENUM ('CASH', 'CREDIT');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('CASH', 'VISA', 'MASTERCARD');

-- CreateEnum
CREATE TYPE "FolioLineKind" AS ENUM ('ROOM_CHARGE', 'TAX', 'EXTRA', 'SPECIAL_REQUEST', 'PAYMENT', 'DEPOSIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RECEPTIONIST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseRate" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "isDirty" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateTypeRoomTypeRate" (
    "rateTypeId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "RateTypeRoomTypeRate_pkey" PRIMARY KEY ("rateTypeId","roomTypeId")
);

-- CreateTable
CREATE TABLE "MarketPlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresSource" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MarketPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialRequestItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SpecialRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "title" "Title" NOT NULL DEFAULT 'MR',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "idType" "IdType" NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idExpMonth" INTEGER,
    "idExpYear" INTEGER,
    "idLifetime" BOOLEAN NOT NULL DEFAULT false,
    "nationality" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "birthCity" TEXT NOT NULL,
    "birthState" TEXT,
    "birthCountry" TEXT,
    "gender" "Gender",
    "guestType" "GuestType" NOT NULL DEFAULT 'REGULAR',
    "occupation" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "guestId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "rateTypeId" TEXT NOT NULL,
    "marketPlaceId" TEXT NOT NULL,
    "sourceId" TEXT,
    "arrival" TIMESTAMP(3) NOT NULL,
    "departure" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "infants" INTEGER NOT NULL DEFAULT 0,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "settlementMethod" "SettlementMethod" NOT NULL DEFAULT 'CASH',
    "cardType" "CardType",
    "cardLast4" TEXT,
    "cardExpiry" TEXT,
    "voucherNo" TEXT,
    "notes" TEXT,
    "ratePerNight" DECIMAL(12,2) NOT NULL,
    "bookedById" TEXT NOT NULL,
    "checkedInById" TEXT,
    "checkedOutById" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folio" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "reservationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolioLine" (
    "id" TEXT NOT NULL,
    "folioId" TEXT NOT NULL,
    "kind" "FolioLineKind" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolioLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationSpecialRequest" (
    "reservationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReservationSpecialRequest_pkey" PRIMARY KEY ("reservationId","itemId")
);

-- CreateTable
CREATE TABLE "OutOfOrder" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "remark" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutOfOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "telephoned" BOOLEAN NOT NULL DEFAULT false,
    "returnedYourCall" BOOLEAN NOT NULL DEFAULT false,
    "pleaseCall" BOOLEAN NOT NULL DEFAULT false,
    "willCallAgain" BOOLEAN NOT NULL DEFAULT false,
    "cameToSeeYou" BOOLEAN NOT NULL DEFAULT false,
    "wantToSeeYou" BOOLEAN NOT NULL DEFAULT false,
    "rush" BOOLEAN NOT NULL DEFAULT false,
    "special" BOOLEAN NOT NULL DEFAULT false,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_name_key" ON "RoomType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- CreateIndex
CREATE UNIQUE INDEX "RateType_name_key" ON "RateType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPlace_name_key" ON "MarketPlace"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialRequestItem_name_key" ON "SpecialRequestItem"("name");

-- CreateIndex
CREATE INDEX "Guest_lastName_firstName_idx" ON "Guest"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_seq_key" ON "Reservation"("seq");

-- CreateIndex
CREATE INDEX "Reservation_roomId_arrival_departure_idx" ON "Reservation"("roomId", "arrival", "departure");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Folio_seq_key" ON "Folio"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Folio_reservationId_key" ON "Folio"("reservationId");

-- CreateIndex
CREATE INDEX "OutOfOrder_roomId_fromDate_idx" ON "OutOfOrder"("roomId", "fromDate");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateTypeRoomTypeRate" ADD CONSTRAINT "RateTypeRoomTypeRate_rateTypeId_fkey" FOREIGN KEY ("rateTypeId") REFERENCES "RateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateTypeRoomTypeRate" ADD CONSTRAINT "RateTypeRoomTypeRate_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_rateTypeId_fkey" FOREIGN KEY ("rateTypeId") REFERENCES "RateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_marketPlaceId_fkey" FOREIGN KEY ("marketPlaceId") REFERENCES "MarketPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folio" ADD CONSTRAINT "Folio_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolioLine" ADD CONSTRAINT "FolioLine_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "Folio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSpecialRequest" ADD CONSTRAINT "ReservationSpecialRequest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationSpecialRequest" ADD CONSTRAINT "ReservationSpecialRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SpecialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfOrder" ADD CONSTRAINT "OutOfOrder_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutOfOrder" ADD CONSTRAINT "OutOfOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestMessage" ADD CONSTRAINT "GuestMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestMessage" ADD CONSTRAINT "GuestMessage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
