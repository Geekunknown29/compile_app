"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, UploadCloud, FileCode2, PlayCircle, Settings, ShieldAlert, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed" | "awaiting_clarification">("idle");
  const [activeTab, setActiveTab] = useState<"db" | "api" | "ui" | "auth">("db");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const STAGES = [
    "Intent Parsed",
    "Clarification Complete",
    "IR Generated",
    "Architecture Planned",
    "Schema Generated",
    "Validation Passed",
    "Repair Complete",
    "Runtime Simulation Complete"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus("running");
    setJobData(null);
    setAnswers({});
    try {
      const res = await fetch("http://localhost:8000/api/generate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setJobId(data.job_id);
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  };

  const handleSubmitClarifications = async () => {
    if (!jobId) return;
    setStatus("running");
    try {
      await fetch("http://localhost:8000/api/generate/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, answers })
      });
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobId && (status === "running" || status === "awaiting_clarification")) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/generate/status/${jobId}`);
          const data = await res.json();
          setJobData(data);
          
          if (data.status === "awaiting_clarification") {
            setStatus("awaiting_clarification");
          } else if (data.status === "completed" || data.status === "failed") {
            setStatus(data.status);
            clearInterval(interval);
          } else {
            setStatus("running");
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobId, status]);

  const currentStageIndex = jobData 
    ? STAGES.indexOf(jobData.stage) 
    : -1;

  return (
    <main className="min-h-screen p-8 md:p-24 max-w-6xl mx-auto flex flex-col gap-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border border-border">
          <Settings className="w-4 h-4 text-primary" /> 
          AI Compiler for Software Generation MVP
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black">
          From Intent to Architecture.
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Deterministic structured generation. Validation-first architecture. 
          A multi-stage compiler pipeline that turns natural language into reliable, engineered software.
        </p>
      </section>

      {/* Input Area */}
      {status === "idle" && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto w-full space-y-4"
        >
          <div className="relative">
            <textarea
              className="w-full h-40 bg-card border border-border rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder:text-muted-foreground"
              placeholder="E.g., Build a CRM with login, analytics dashboard, premium subscriptions, admin roles, and payment support."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button variant="secondary">
                <UploadCloud className="w-4 h-4 mr-2" /> Media
              </Button>
              <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                <PlayCircle className="w-4 h-4 mr-2" /> Compile System
              </Button>
            </div>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground justify-center">
            <span>Example: </span>
            <button className="underline hover:text-primary transition-colors" onClick={() => setPrompt("Build an LMS with roles for Teachers, Students, and Admins. Must have video upload capabilities.")}>LMS Portal</button>
            <span>•</span>
            <button className="underline hover:text-primary transition-colors" onClick={() => setPrompt("Build an app.")}>Vague Intent (Triggers Clarification)</button>
          </div>
        </motion.section>
      )}

      {/* Clarification Area */}
      {status === "awaiting_clarification" && jobData?.clarification_questions && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto w-full"
        >
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="w-5 h-5" />
                Missing Requirements Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Your request is a bit vague. To compile the correct architecture schemas, please answer a few questions:
              </p>
              {jobData.clarification_questions.map((q: any) => (
                <div key={q.id} className="space-y-2">
                  <label className="text-sm font-medium">{q.question}</label>
                  {q.options ? (
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`p-2.5 rounded-lg border text-sm text-left transition-colors ${
                            answers[q.id] === opt 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border hover:bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Type your answer..."
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <Button className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleSubmitClarifications}>
                Submit Answers & Compile
              </Button>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Pipeline Visualization & Output */}
      {(status === "running" || status === "completed" || status === "failed") && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
          {/* Pipeline Stages */}
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className={`w-5 h-5 ${status === "running" ? "animate-spin" : "text-primary"}`} /> 
                Compiler Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-[2px] bg-border" />
                <div className="space-y-6 relative">
                  {STAGES.map((stage, idx) => {
                    const isCompleted = currentStageIndex > idx || status === "completed";
                    const isCurrent = currentStageIndex === idx && status === "running";
                    const isFailedStage = currentStageIndex === idx && status === "failed";

                    return (
                      <div key={stage} className="flex items-center gap-4 pl-1">
                        <div className={`z-10 bg-background rounded-full p-1`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                          ) : isCurrent ? (
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          ) : isFailedStage ? (
                            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`font-medium ${isCompleted || isCurrent ? "text-foreground" : isFailedStage ? "text-red-500" : "text-muted-foreground"}`}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results/Report Area */}
          <div className="space-y-6">
            {status === "failed" ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="border-red-500/50 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-red-500">
                      <AlertTriangle className="w-5 h-5" />
                      Compilation Halted
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      An error occurred during pipeline execution:
                    </p>
                    <pre className="bg-black/50 p-3 rounded-md text-xs text-red-400 overflow-x-auto border border-white/5 whitespace-pre-wrap max-h-[200px]">
                      {jobData?.error || "Unable to establish network handshake with Gemini API or compile requested assets."}
                    </pre>
                    <div className="pt-2">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => setStatus("idle")}>
                        Return to Input
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : jobData?.report ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-primary" />
                      Reliability Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex border-b border-border mb-4 gap-2">
                        {(["db", "api", "ui", "auth"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                              activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tab === "db" ? "DB Schema" : tab === "api" ? "API Schema" : tab === "ui" ? "UI Schema" : "Auth Rules"}
                          </button>
                        ))}
                      </div>
                      <pre className="bg-black/50 p-3 rounded-md text-sm text-blue-300 overflow-x-auto border border-white/5 max-h-[300px]">
                        {JSON.stringify(
                          activeTab === "db"
                            ? jobData.report.schemas?.db_schema
                            : activeTab === "api"
                            ? jobData.report.schemas?.api_schema
                            : activeTab === "ui"
                            ? jobData.report.schemas?.ui_schema
                            : jobData.report.schemas?.auth_rules,
                          null,
                          2
                        ) || JSON.stringify(jobData.report.architecture_summary, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Validation & Repair</h4>
                      <ul className="list-disc list-inside text-sm text-green-400">
                        <li>Validation Passed: {jobData.report.validation_results.passed ? "True" : "False"}</li>
                        {jobData.report.repair_history.map((h: string, i: number) => (
                          <li key={i} className="text-yellow-400">Repaired: {h}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Runtime Status</h4>
                      <div className="flex gap-2 items-center">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/50 uppercase">
                          {jobData.report.runtime_risks.status}
                        </span>
                        <span className="text-sm text-muted-foreground">Confidence: {jobData.report.execution_confidence * 100}%</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex gap-4">
                      <Button className="w-full" onClick={() => window.open(`http://localhost:8000/api/download/${jobId}`)}>
                        <FileCode2 className="w-4 h-4 mr-2" /> Download Project ZIP
                      </Button>
                     <Button className="w-full" onClick={() => setStatus("idle")}>
                        New Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full flex items-center justify-center border-dashed border-2 bg-transparent opacity-50">
                <CardContent className="text-center text-muted-foreground p-8 flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Orchestrator is compiling the system...</p>
                  <p className="text-sm">Enforcing schemas and running validation loops.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
