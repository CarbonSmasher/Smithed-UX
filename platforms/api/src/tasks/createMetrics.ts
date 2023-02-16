import { DocumentReference, getFirestore } from "firebase-admin/firestore";

function forLastDays(days: number): string[] {
    const date = new Date();
    const dates: string[] = []
    for (let day = 0; day < days; day++) {
        dates.push(date.toLocaleDateString().replaceAll("/", "-"))
        date.setDate(date.getDate() - 1);
    }
    return dates;
}

async function getDaysDownload(doc: DocumentReference, days: string[]): Promise<number> {
    let total = 0
    for (let day of days) {
        const dayDoc = await doc.collection("downloads").doc(day).get()

        total += await dayDoc.get('total') ?? 0

    }
    return total;
}

export async function calculateDownloads() {
    const docs = await getFirestore().collection("analytics").listDocuments()

    const past7Days = forLastDays(7);
    const past30days = forLastDays(30);
    const today = new Date().toLocaleDateString().replaceAll("/", "-");

    for (const doc of docs) {
        const past7DayDownloads = await getDaysDownload(doc, past7Days)

        await getFirestore().collection("packs").doc(doc.id).set({
            stats: {
                downloads: {
                    pastWeek: past7DayDownloads,
                    total: (await doc.collection('downloads').doc('total').get()).data()?.value ?? 0,
                    today: (await doc.collection('downloads').doc(today).get()).data()?.total ?? 0
                }
            }
        }, { merge: true })
    }
}