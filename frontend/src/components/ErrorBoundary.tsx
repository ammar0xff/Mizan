import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Production error logging: log to console with contextual group
    console.error("Uncaught application error captured by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12 text-foreground font-sans">
          <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl text-center md:p-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="size-7" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              حدث خطأ غير متوقع
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              نعتذر عن هذا العطل المؤقت. تم تسجيل تفاصيل الخطأ للعمل على حله فورياً، ويمكنك تحديث الصفحة للمتابعة.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-start text-xs font-mono text-destructive">
                <summary className="cursor-pointer font-bold select-none">تفاصيل الخطأ (بيئة التطوير)</summary>
                <p className="mt-2 whitespace-pre-wrap break-words">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="mt-2 max-h-40 overflow-auto text-[10px] text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Button onClick={this.handleReset} className="w-full sm:w-auto gap-2">
                <RefreshCw className="size-4" />
                <span>إعادة تحميل الصفحة</span>
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="w-full sm:w-auto gap-2">
                <Home className="size-4" />
                <span>العودة للرئيسية</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
