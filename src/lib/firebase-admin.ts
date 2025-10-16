import type { App } from "firebase-admin/app";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

const normalizePrivateKey = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.replace(/\\n/g, "\n");
};

const getServiceAccountFromEnv = (): FirebaseServiceAccount | null => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      const projectId = parsed.project_id ?? parsed.projectId;
      const clientEmail = parsed.client_email ?? parsed.clientEmail;
      const privateKey = normalizePrivateKey(parsed.private_key ?? parsed.privateKey);
      if (!projectId || !clientEmail || !privateKey) {
        console.warn("FIREBASE_SERVICE_ACCOUNT fornecido, mas com campos ausentes.");
        return null;
      }
      return {
        projectId,
        clientEmail,
        privateKey,
      };
    } catch (error) {
      console.error("Não foi possível interpretar FIREBASE_SERVICE_ACCOUNT como JSON:", error);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
};

let firebaseApp: App | null = null;

export const getFirebaseAdminApp = (): App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = getServiceAccountFromEnv();
  if (!serviceAccount) {
    return null;
  }

  try {
    const isAlreadyInitialized = getApps().length > 0;
    firebaseApp = isAlreadyInitialized
      ? getApps()[0]!
      : initializeApp({
          credential: cert({
            projectId: serviceAccount.projectId,
            clientEmail: serviceAccount.clientEmail,
            privateKey: serviceAccount.privateKey,
          }),
        });
    return firebaseApp;
  } catch (error) {
    console.error("Falha ao inicializar Firebase Admin:", error);
    return null;
  }
};

export type PersistAnalysisInput = {
  payload: Record<string, unknown>;
  attachments: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  aiResponse: Record<string, unknown> | null;
  irpfImpacts: Record<string, unknown> | null;
  webhookResponse: string | null;
};

export type PersistAnalysisResult = {
  saved: boolean;
  documentId: string | null;
  error?: string;
};

export const persistAnalysisRecord = async (
  input: PersistAnalysisInput
): Promise<PersistAnalysisResult> => {
  const app = getFirebaseAdminApp();
  if (!app) {
    return {
      saved: false,
      documentId: null,
      error:
        "Firebase Admin não configurado. Defina FIREBASE_SERVICE_ACCOUNT ou as variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    };
  }

  try {
    const db = getFirestore(app);
    const collectionName = process.env.FIREBASE_ANALYSES_COLLECTION ?? "analyses";
    const docRef = await db.collection(collectionName).add({
      payload: input.payload,
      attachments: input.attachments,
      aiResponse: input.aiResponse,
      irpfImpacts: input.irpfImpacts,
      webhookResponse: input.webhookResponse,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      saved: true,
      documentId: docRef.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao salvar análise.";
    console.error("Falha ao persistir análise no Firebase:", error);
    return {
      saved: false,
      documentId: null,
      error: message,
    };
  }
};
