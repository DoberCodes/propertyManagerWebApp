package com.maintleyapp;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.Preview;
import androidx.camera.core.ZoomState;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;

import java.io.File;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public class NativeScannerActivity extends AppCompatActivity {
    public static final String EXTRA_MODE = "mode";
    public static final String RESULT_MODE = "mode";
    public static final String RESULT_VALUE = "value";
    public static final String RESULT_URI = "uri";

    private static final String MODE_BARCODE = "barcode";
    private static final String MODE_PHOTO = "photo";

    private PreviewView previewView;
    private TextView hintView;
    private ImageButton torchButton;
    private FrameLayout.LayoutParams closeParams;
    private FrameLayout.LayoutParams torchParams;
    private FrameLayout.LayoutParams hintParams;
    private FrameLayout.LayoutParams captureParams;
    private Camera camera;
    private ImageCapture imageCapture;
    private ImageAnalysis imageAnalysis;
    private BarcodeScanner barcodeScanner;
    private ExecutorService cameraExecutor;
    private ScaleGestureDetector scaleGestureDetector;
    private String mode;
    private boolean isTorchOn = false;
    private boolean isScaling = false;
    private final AtomicBoolean isAnalyzingFrame = new AtomicBoolean(false);
    private final AtomicBoolean hasReturnedResult = new AtomicBoolean(false);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mode = getIntent().getStringExtra(EXTRA_MODE);
        if (!MODE_PHOTO.equals(mode)) {
            mode = MODE_BARCODE;
        }

        cameraExecutor = Executors.newSingleThreadExecutor();
        if (MODE_BARCODE.equals(mode)) {
            barcodeScanner = BarcodeScanning.getClient();
        }

        buildLayout();
        setupGestures();
        startCamera();
    }

    private void buildLayout() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF000000);

        previewView = new PreviewView(this);
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        root.addView(
            previewView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );

        hintView = new TextView(this);
        hintView.setText(MODE_PHOTO.equals(mode)
            ? "Pinch to zoom. Tap to focus."
            : "Point at a barcode. Pinch to zoom. Tap to focus.");
        hintView.setTextColor(0xFFFFFFFF);
        hintView.setTextSize(13);
        hintView.setGravity(Gravity.CENTER);
        hintView.setBackground(buildRoundedBackground(0x99000000, dp(18)));
        hintView.setPadding(dp(14), dp(8), dp(14), dp(8));
        hintParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        root.addView(hintView, hintParams);

        ImageButton closeButton = buildIconButton(
            R.drawable.ic_scanner_close,
            "Close scanner",
            dp(48),
            0xB3000000
        );
        closeParams = new FrameLayout.LayoutParams(
            dp(48),
            dp(48),
            Gravity.TOP | Gravity.START
        );
        root.addView(closeButton, closeParams);
        closeButton.setOnClickListener((view) -> finishCanceled());

        torchButton = buildIconButton(
            R.drawable.ic_scanner_flash,
            "Turn flashlight on",
            dp(48),
            0xB3000000
        );
        torchParams = new FrameLayout.LayoutParams(
            dp(48),
            dp(48),
            Gravity.TOP | Gravity.END
        );
        root.addView(torchButton, torchParams);
        torchButton.setOnClickListener((view) -> toggleTorch(torchButton));
        torchButton.setAlpha(0.55f);
        torchButton.setEnabled(false);

        if (MODE_PHOTO.equals(mode)) {
            ImageButton captureButton = buildIconButton(
                R.drawable.ic_scanner_camera,
                "Capture photo",
                dp(72),
                0xEE047857
            );
            captureParams = new FrameLayout.LayoutParams(
                dp(72),
                dp(72),
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );
            root.addView(captureButton, captureParams);
            captureButton.setOnClickListener((view) -> capturePhoto());
        }

        applyOverlayInsets(getStatusBarHeight(), getNavigationBarHeight(), 0);
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            applyOverlayInsets(
                systemBars.top,
                systemBars.bottom,
                Math.max(systemBars.left, systemBars.right)
            );
            return insets;
        });
        setContentView(root);
        ViewCompat.requestApplyInsets(root);
    }

    private ImageButton buildIconButton(int iconResource, String contentDescription, int size, int backgroundColor) {
        ImageButton button = new ImageButton(this);
        button.setImageResource(iconResource);
        button.setContentDescription(contentDescription);
        button.setBackground(buildOvalBackground(backgroundColor));
        button.setColorFilter(0xFFFFFFFF);
        button.setScaleType(ImageView.ScaleType.CENTER);
        button.setPadding(size / 4, size / 4, size / 4, size / 4);
        return button;
    }

    private GradientDrawable buildOvalBackground(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.OVAL);
        drawable.setColor(color);
        return drawable;
    }

    private GradientDrawable buildRoundedBackground(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.RECTANGLE);
        drawable.setCornerRadius(radius);
        drawable.setColor(color);
        return drawable;
    }

    private void applyOverlayInsets(int topInset, int bottomInset, int horizontalInset) {
        int topMargin = Math.max(topInset, 0) + dp(16);
        int sideMargin = Math.max(horizontalInset, 0) + dp(16);
        int bottomMargin = Math.max(bottomInset, 0) + dp(MODE_PHOTO.equals(mode) ? 120 : 28);

        if (closeParams != null) {
            closeParams.topMargin = topMargin;
            closeParams.leftMargin = sideMargin;
        }
        if (torchParams != null) {
            torchParams.topMargin = topMargin;
            torchParams.rightMargin = sideMargin;
        }
        if (hintParams != null) {
            hintParams.leftMargin = dp(16);
            hintParams.rightMargin = dp(16);
            hintParams.bottomMargin = bottomMargin;
        }
        if (captureParams != null) {
            captureParams.bottomMargin = Math.max(bottomInset, 0) + dp(32);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private int getStatusBarHeight() {
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        return resourceId > 0 ? getResources().getDimensionPixelSize(resourceId) : 0;
    }

    private int getNavigationBarHeight() {
        int resourceId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        return resourceId > 0 ? getResources().getDimensionPixelSize(resourceId) : 0;
    }

    private void setupGestures() {
        scaleGestureDetector = new ScaleGestureDetector(this, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override
            public boolean onScaleBegin(@NonNull ScaleGestureDetector detector) {
                isScaling = true;
                return true;
            }

            @Override
            public boolean onScale(@NonNull ScaleGestureDetector detector) {
                if (camera == null) return false;
                ZoomState zoomState = camera.getCameraInfo().getZoomState().getValue();
                if (zoomState == null) return false;

                float nextZoom = zoomState.getZoomRatio() * detector.getScaleFactor();
                nextZoom = Math.max(zoomState.getMinZoomRatio(), Math.min(nextZoom, zoomState.getMaxZoomRatio()));
                camera.getCameraControl().setZoomRatio(nextZoom);
                return true;
            }
        });

        previewView.setOnTouchListener((view, event) -> {
            scaleGestureDetector.onTouchEvent(event);
            if (event.getActionMasked() == MotionEvent.ACTION_UP) {
                if (!isScaling) {
                    focusAt(event.getX(), event.getY());
                }
                isScaling = false;
                view.performClick();
            } else if (event.getActionMasked() == MotionEvent.ACTION_CANCEL) {
                isScaling = false;
            }
            return true;
        });
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                imageCapture = new ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .build();

                cameraProvider.unbindAll();
                if (MODE_BARCODE.equals(mode)) {
                    imageAnalysis = new ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build();
                    imageAnalysis.setAnalyzer(cameraExecutor, this::analyzeBarcodeFrame);
                    camera = cameraProvider.bindToLifecycle(
                        this,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageCapture,
                        imageAnalysis
                    );
                } else {
                    camera = cameraProvider.bindToLifecycle(
                        this,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageCapture
                    );
                }
                updateTorchAvailability();
            } catch (Exception error) {
                Toast.makeText(this, "Unable to open camera.", Toast.LENGTH_SHORT).show();
                finishCanceled();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void analyzeBarcodeFrame(@NonNull ImageProxy imageProxy) {
        if (barcodeScanner == null || hasReturnedResult.get()) {
            imageProxy.close();
            return;
        }
        if (!isAnalyzingFrame.compareAndSet(false, true)) {
            imageProxy.close();
            return;
        }
        if (imageProxy.getImage() == null) {
            isAnalyzingFrame.set(false);
            imageProxy.close();
            return;
        }

        InputImage image = InputImage.fromMediaImage(
            imageProxy.getImage(),
            imageProxy.getImageInfo().getRotationDegrees()
        );
        barcodeScanner.process(image)
            .addOnSuccessListener(this::handleBarcodeResults)
            .addOnFailureListener((error) -> {
                // Keep scanning if a single frame cannot be processed.
            })
            .addOnCompleteListener((task) -> {
                isAnalyzingFrame.set(false);
                imageProxy.close();
            });
    }

    private void handleBarcodeResults(List<Barcode> barcodes) {
        if (barcodes == null || barcodes.isEmpty() || hasReturnedResult.get()) return;
        for (Barcode barcode : barcodes) {
            String value = barcode.getRawValue();
            if (value != null && !value.trim().isEmpty()) {
                returnBarcode(value.trim());
                return;
            }
        }
    }

    private void focusAt(float x, float y) {
        if (camera == null) return;
        MeteringPoint point = previewView.getMeteringPointFactory().createPoint(x, y);
        FocusMeteringAction action = new FocusMeteringAction.Builder(
            point,
            FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE
        )
            .setAutoCancelDuration(3, TimeUnit.SECONDS)
            .build();
        camera.getCameraControl().startFocusAndMetering(action);
    }

    private void updateTorchAvailability() {
        if (torchButton == null || camera == null) return;
        boolean hasFlash = camera.getCameraInfo().hasFlashUnit();
        torchButton.setEnabled(hasFlash);
        torchButton.setAlpha(hasFlash ? 1f : 0.45f);
    }

    private void toggleTorch(ImageButton torchButton) {
        if (camera == null || !camera.getCameraInfo().hasFlashUnit()) {
            Toast.makeText(this, "Flash is not available.", Toast.LENGTH_SHORT).show();
            return;
        }
        isTorchOn = !isTorchOn;
        camera.getCameraControl().enableTorch(isTorchOn);
        torchButton.setBackground(buildOvalBackground(isTorchOn ? 0xEE047857 : 0xB3000000));
        torchButton.setContentDescription(isTorchOn ? "Turn flashlight off" : "Turn flashlight on");
    }

    private void capturePhoto() {
        if (imageCapture == null || hasReturnedResult.get()) return;
        File file = new File(getCacheDir(), "maintley-label-" + System.currentTimeMillis() + ".jpg");
        ImageCapture.OutputFileOptions options = new ImageCapture.OutputFileOptions.Builder(file).build();
        imageCapture.takePicture(
            options,
            ContextCompat.getMainExecutor(this),
            new ImageCapture.OnImageSavedCallback() {
                @Override
                public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                    if (hasReturnedResult.getAndSet(true)) return;
                    Intent data = new Intent();
                    data.putExtra(RESULT_MODE, MODE_PHOTO);
                    data.putExtra(RESULT_URI, Uri.fromFile(file).toString());
                    setResult(Activity.RESULT_OK, data);
                    finish();
                }

                @Override
                public void onError(@NonNull ImageCaptureException exception) {
                    Toast.makeText(NativeScannerActivity.this, "Could not capture photo.", Toast.LENGTH_SHORT).show();
                }
            }
        );
    }

    private void returnBarcode(String value) {
        if (hasReturnedResult.getAndSet(true)) return;
        Intent data = new Intent();
        data.putExtra(RESULT_MODE, MODE_BARCODE);
        data.putExtra(RESULT_VALUE, value);
        setResult(Activity.RESULT_OK, data);
        finish();
    }

    private void finishCanceled() {
        setResult(Activity.RESULT_CANCELED);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (barcodeScanner != null) {
            barcodeScanner.close();
        }
        if (cameraExecutor != null) {
            cameraExecutor.shutdown();
        }
    }
}