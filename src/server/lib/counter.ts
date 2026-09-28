import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1244 },
}, { collection: "counters" });

const Counter = (mongoose.models.Counter as mongoose.Model<any>) || mongoose.model("Counter", CounterSchema);

export async function nextRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const doc: any = await Counter.findOneAndUpdate(
      { _id: `ecv_${year}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const seq = doc.seq;
    return `ECV-${year}-${String(seq).padStart(6, "0")}`;
  } catch (e) {
    // fallback for race / not connected (e.g., no Mongo yet)
    return `ECV-${year}-${String(Math.floor(100000 + Math.random()*900000)).padStart(6, "0")}`;
  }
}
