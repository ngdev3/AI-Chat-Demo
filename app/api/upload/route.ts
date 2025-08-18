import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import formidable from 'formidable';
import pdf from 'pdf-parse';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Disable the default body parser for this route to handle multipart forms
export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({});
        form.parse(req as any, (err, fields, files) => {
            if (err) reject(err);
            resolve({ fields, files });
        });
    });
};

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { fields, files } = await parseForm(req);

        const conversationId = Array.isArray(fields.conversationId) ? fields.conversationId[0] : fields.conversationId;
        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file || !conversationId) {
            return new NextResponse('File and conversationId are required', { status: 400 });
        }

        // Verify user owns the conversation
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, user: { email: session.user.email } },
        });

        if (!conversation) {
            return new NextResponse('Conversation not found or user not authorized', { status: 404 });
        }

        let textContent = '';
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = await fs.readFile(file.filepath);
            const data = await pdf(dataBuffer);
            textContent = data.text;
        } else if (file.mimetype === 'text/plain') {
            textContent = await fs.readFile(file.filepath, 'utf-8');
        } else {
            return new NextResponse('Unsupported file type', { status: 400 });
        }

        await prisma.document.create({
            data: {
                filename: file.originalFilename || 'document',
                content: textContent,
                conversationId: conversationId,
            }
        });

        return new NextResponse('File uploaded successfully', { status: 200 });

    } catch (error) {
        console.error('UPLOAD_ERROR', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
