type App = import("firebase-admin/app").App;

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
let adminAppModule: typeof import("firebase-admin/app") | null = null;
let firestoreModule: typeof import("firebase-admin/firestore") | null = null;

const ensureFirebaseAdmin = async (): Promise<boolean> => {
  if (adminAppModule && firestoreModule) {
    return true;
  }

  try {
    const [appModule, firestore] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/firestore"),
    ]);
    adminAppModule = appModule;
    firestoreModule = firestore;
    return true;
  } catch (error) {
    console.warn(
      "Firebase Admin SDK não está disponível neste ambiente. Persistência de histórico será desativada.",
      error instanceof Error ? error.message : error
    );
    adminAppModule = null;
    firestoreModule = null;
    return false;
  }
};

export const getFirebaseAdminApp = async (): Promise<App | null> => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccount = getServiceAccountFromEnv();
  if (!serviceAccount) {
    return null;
  }

  const hasAdminSdk = await ensureFirebaseAdmin();
  if (!hasAdminSdk || !adminAppModule) {
    return null;
  }

  const { cert, getApps, initializeApp } = adminAppModule;

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
  userId?: string | null;
  clientName?: string;
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
  const app = await getFirebaseAdminApp();
  if (!app || !firestoreModule) {
    return {
      saved: false,
      documentId: null,
      error:
        "Firebase Admin não configurado. Defina FIREBASE_SERVICE_ACCOUNT ou as variáveis FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    };
  }

  try {
    const { FieldValue, getFirestore } = firestoreModule;
    const db = getFirestore(app);
    const collectionName = process.env.FIREBASE_ANALYSES_COLLECTION ?? "analyses";
    const docRef = await db.collection(collectionName).add({
      userId: input.userId ?? null,
      clientName: input.clientName ?? null,
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

export type SavedAnalysis = {
  id: string;
  userId: string | null;
  clientName: string | null;
  createdAt: Date;
  aiResponse: Record<string, unknown> | null;
};

export const getAnalysesByUserId = async (
  userId: string
): Promise<SavedAnalysis[]> => {
  const app = await getFirebaseAdminApp();
  if (!app || !firestoreModule) {
    return [];
  }

  try {
    const { getFirestore } = firestoreModule;
    const db = getFirestore(app);
    const collectionName = process.env.FIREBASE_ANALYSES_COLLECTION ?? "analyses";

    const snapshot = await db
      .collection(collectionName)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId ?? null,
        clientName: data.clientName ?? data.payload?.companyName ?? "Sem nome",
        createdAt: data.createdAt?.toDate() ?? new Date(),
        aiResponse: data.aiResponse ?? null,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar análises:", error);
    return [];
  }
};
