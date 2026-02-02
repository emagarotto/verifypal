import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Clipboard, 
  Zap, 
  Shield, 
  Clock, 
  Download,
  Check,
  ArrowRight,
  Chrome,
  Lock,
  Eye,
  RefreshCw,
  Send
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Mail,
      title: "Email Detection",
      description: "Automatically scans Gmail, Outlook, and Yahoo for verification codes in real-time."
    },
    {
      icon: Zap,
      title: "Auto-Fill & Submit",
      description: "Detected codes are instantly filled and submitted, completing verification automatically."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "All processing happens locally. No data is sent to external servers."
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "No more switching tabs, copying codes, and pasting them manually."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Install the Extension",
      description: "Download and install VerifyPal from Chrome Web Store or load it manually."
    },
    {
      number: "2",
      title: "Open Your Email",
      description: "When you receive a verification email, VerifyPal automatically detects the code."
    },
    {
      number: "3",
      title: "Auto-Fill & Submit",
      description: "The code is auto-filled and auto-applied."
    }
  ];

  const supportedEmails = [
    { name: "Gmail", supported: true },
    { name: "Outlook", supported: true },
    { name: "Yahoo Mail", supported: true },
    { name: "Other web mail", supported: false, note: "Should work too!" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="relative overflow-hidden pt-20 pb-10 sm:pt-32 sm:pb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6" data-testid="text-hero-title">
                Your verification codes,{" "}
                <span className="text-primary whitespace-nowrap">on autopilot</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-description">
                VerifyPal grabs your code, fills it in, and signs you in instantly.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6" data-testid="privacy-highlights">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">100% Local Processing</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">No Tracking</span>
                </div>
                <a 
                  href="https://github.com/emagarotto/verifypal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-open-source-hero"
                >
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Open Source</span>
                </a>
              </div>
            </div>

            <div className="mt-12 mx-auto max-w-5xl">
              <Card className="overflow-hidden border-2">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10">
                    <div className="flex flex-col lg:flex-row items-stretch gap-6">
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-3 p-4 bg-card rounded-lg border flex-1">
                          <Mail className="h-6 w-6 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Your verification code</p>
                            <p className="text-2xl font-mono font-bold tracking-widest" data-testid="text-demo-code">847293</p>
                          </div>
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex items-center justify-center gap-2 text-primary mt-3">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Auto-syncing</span>
                        </div>
                      </div>
                      <ArrowRight className="h-6 w-6 text-muted-foreground hidden lg:block self-center" />
                      <div className="flex-1 flex flex-col">
                        <div className="p-4 bg-card rounded-lg border flex-1 flex flex-col justify-center">
                          <p className="text-sm text-muted-foreground mb-3">Enter verification code</p>
                          <div className="flex gap-1.5 justify-center">
                            {['8', '4', '7', '2', '9', '3'].map((digit, i) => (
                              <div 
                                key={i}
                                className="w-9 h-11 rounded-md border-2 border-primary bg-primary/5 flex items-center justify-center text-lg font-mono font-bold"
                                data-testid={`text-digit-${i}`}
                              >
                                {digit}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-600 mt-3">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Auto-filled</span>
                        </div>
                      </div>
                      <ArrowRight className="h-6 w-6 text-muted-foreground hidden lg:block self-center" />
                      <div className="flex-1 flex flex-col">
                        <div className="p-4 bg-card rounded-lg border flex-1 flex flex-col justify-center">
                          <p className="text-sm text-muted-foreground mb-3 text-center">Verification complete</p>
                          <div className="flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Check className="h-8 w-8 text-green-500" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-600 mt-3">
                          <Send className="h-4 w-4" />
                          <span className="text-sm font-medium">Auto-submitted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="text-features-title">Why VerifyPal?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Simple, secure, and lightning fast!
                <br />
                Here's what makes VerifyPal the best verification code assistant.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4" data-testid="text-how-title">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get started in seconds. No configuration needed.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {steps.map((step, index) => (
                  <div key={index} className="text-center" data-testid={`step-${index}`}>
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4" data-testid="text-privacy-title">Your Privacy Matters</h2>
                  <p className="text-muted-foreground mb-6">
                    VerifyPal is designed with privacy at its core. All code detection and 
                    processing happens entirely on your device.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="mt-1">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">100% Local Processing</p>
                        <p className="text-sm text-muted-foreground">
                          No data ever leaves your browser. Everything runs locally.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1">
                        <Eye className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">No Tracking</p>
                        <p className="text-sm text-muted-foreground">
                          We don't collect any analytics, usage data, or personal information.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-1">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Open Source</p>
                        <p className="text-sm text-muted-foreground">
                          Review the code yourself. Full transparency in how we handle your data.{" "}
                          <a 
                            href="https://github.com/emagarotto/verifypal" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            data-testid="link-view-source"
                          >
                            View source code
                          </a>
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <Card className="p-6" data-testid="card-supported-emails">
                  <h3 className="font-semibold mb-4">Supported Email Providers</h3>
                  <div className="space-y-3">
                    {supportedEmails.map((email, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        data-testid={`email-provider-${index}`}
                      >
                        <span>{email.name}</span>
                        {email.supported ? (
                          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                            <Check className="h-3 w-3 mr-1" />
                            Supported
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {email.note}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto overflow-hidden" data-testid="card-download-cta">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 sm:p-12 text-center">
                  <Chrome className="h-12 w-12 mx-auto mb-6 opacity-90" />
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    Ready to Save Time?
                  </h2>
                  <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                    Install VerifyPal now and never manually copy a verification code again.
                  </p>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="gap-2"
                    data-testid="button-download-cta"
                    onClick={() => window.location.href = '/api/download-extension'}
                  >
                    <Download className="h-5 w-5" />
                    Download for Chrome
                  </Button>
                  <p className="text-sm text-primary-foreground/60 mt-4">
                    Works with Chrome, Edge, Brave, and other Chromium browsers
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center" data-testid="text-install-title">
                Manual Installation
              </h2>
              <Card data-testid="card-install-instructions">
                <CardContent className="p-6 sm:p-8">
                  <ol className="space-y-6">
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                        1
                      </span>
                      <div>
                        <p className="font-medium mb-1">Download the extension files</p>
                        <p className="text-sm text-muted-foreground">
                          Download the extension package from this page and extract it to a folder.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                        2
                      </span>
                      <div>
                        <p className="font-medium mb-1">Open Chrome Extensions</p>
                        <p className="text-sm text-muted-foreground">
                          Go to <code className="px-2 py-1 rounded bg-muted text-sm">chrome://extensions</code> in your browser.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                        3
                      </span>
                      <div>
                        <p className="font-medium mb-1">Enable Developer Mode</p>
                        <p className="text-sm text-muted-foreground">
                          Toggle "Developer mode" in the top right corner.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                        4
                      </span>
                      <div>
                        <p className="font-medium mb-1">Load the Extension</p>
                        <p className="text-sm text-muted-foreground">
                          Click "Load unpacked" and select the extracted extension folder.
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clipboard className="h-5 w-5 text-primary" />
              <span className="font-semibold">VerifyPal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with privacy in mind. No data collection.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
