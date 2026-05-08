from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
import cv2
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
import base64, os, io, time

app = FastAPI(title="Restore-GAN API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════
#  DS1 — Generator
#  5 ResBlocks, BatchNorm, Sigmoid
#  File: restoregan_generator.pth
# ═══════════════════════════════════════════════

class ResidualBlock(nn.Module):
    def __init__(self, channels, use_bn=True):
        super().__init__()
        layers = [nn.Conv2d(channels, channels, 3, padding=1)]
        if use_bn: layers.append(nn.BatchNorm2d(channels))
        layers += [nn.ReLU(inplace=True), nn.Conv2d(channels, channels, 3, padding=1)]
        if use_bn: layers.append(nn.BatchNorm2d(channels))
        self.block = nn.Sequential(*layers)
    def forward(self, x):
        return x + self.block(x)

class Generator(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1      = nn.Conv2d(3, 64, 9, padding=4)
        self.res_blocks = nn.Sequential(*[ResidualBlock(64, use_bn=True) for _ in range(5)])
        self.conv2      = nn.Conv2d(64, 64, 3, padding=1)
        self.conv3      = nn.Conv2d(64, 3, 9, padding=4)
        self.relu       = nn.ReLU()
    def forward(self, x):
        x1  = self.relu(self.conv1(x))
        res = self.res_blocks(x1)
        x2  = self.conv2(res)
        return torch.sigmoid(self.conv3(x1 + x2))

# ═══════════════════════════════════════════════
#  DS2 — Generator2
#  6 ResBlocks, No BN, Tanh
#  File: generator_epoch_15.pth
# ═══════════════════════════════════════════════

class ResidualBlockNoBN(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(channels, channels, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels, channels, 3, padding=1),
        )
    def forward(self, x):
        return x + self.block(x)

class Generator2(nn.Module):
    def __init__(self):
        super().__init__()
        self.initial   = nn.Sequential(nn.Conv2d(3, 64, 3, padding=1), nn.ReLU(inplace=True))
        self.residuals = nn.Sequential(*[ResidualBlockNoBN(64) for _ in range(6)])
        self.final     = nn.Sequential(nn.Conv2d(64, 3, 3, padding=1), nn.Tanh())
    def forward(self, x):
        x = self.initial(x)
        x = self.residuals(x)
        return self.final(x)

# ═══════════════════════════════════════════════
#  GLOBAL STATE — only one model loaded at a time
# ═══════════════════════════════════════════════

device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Check which .pth files exist on disk
DS1_PATH = os.path.join(MODEL_DIR, "restoregan_generator.pth")
DS2_PATH = os.path.join(MODEL_DIR, "generator_epoch_15.pth")

ds1_exists = os.path.exists(DS1_PATH)
ds2_exists = os.path.exists(DS2_PATH)

active_model    = None   # the currently loaded model object
active_dataset  = None   # "ds1" or "ds2"
ds1_loaded      = False
ds2_loaded      = False

def load_model(dataset: str):
    """Load the requested model, unload the other."""
    global active_model, active_dataset, ds1_loaded, ds2_loaded

    if dataset == active_dataset and active_model is not None:
        return True, f"{dataset.upper()} already loaded"

    # unload current
    active_model   = None
    active_dataset = None
    ds1_loaded     = False
    ds2_loaded     = False

    try:
        if dataset == "ds1":
            m = Generator().to(device)
            m.load_state_dict(torch.load(DS1_PATH, map_location=device))
            m.eval()
            active_model   = m
            active_dataset = "ds1"
            ds1_loaded     = True
            print(f"✅ DS1 loaded — restoregan_generator.pth")
        else:
            m = Generator2().to(device)
            m.load_state_dict(torch.load(DS2_PATH, map_location=device))
            m.eval()
            active_model   = m
            active_dataset = "ds2"
            ds2_loaded     = True
            print(f"✅ DS2 loaded — generator_epoch_15.pth")
        return True, f"{dataset.upper()} loaded successfully"
    except Exception as e:
        print(f"⚠️  Failed to load {dataset}: {e}")
        return False, str(e)

# Load DS1 by default on startup
load_model("ds1")

# ═══════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════

def blur_score(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def to_b64(img_rgb):
    _, buf = cv2.imencode(".png", cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
    return base64.b64encode(buf).decode()

def make_lq_ds1(pil_img):
    lq_t = transforms.Compose([
        transforms.Resize((96, 96)),
        transforms.GaussianBlur(kernel_size=7, sigma=(2.0, 3.0)),
        transforms.ToTensor()
    ])
    lq_pil = transforms.ToPILImage()(lq_t(pil_img))
    return lq_t(pil_img).unsqueeze(0).to(device), lq_pil

def make_lq_ds2(pil_img):
    """
    Exact Colab DS2 LQ pipeline:
      1. Resize to 96x96
      2. cv2.GaussianBlur(k=7)           — strongest blur in training
      3. Downsample x0.5 + upsample INTER_CUBIC  — same as Colab scale=0.5
      4. Transform: ToPILImage → ToTensor → Normalize([0.5]*3,[0.5]*3)
    """
    import numpy as np

    # PIL → numpy RGB → resize to 96x96
    img_rgb = np.array(pil_img.convert("RGB").resize((96, 96), Image.BILINEAR))
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)

    # Step 1 — GaussianBlur k=7 (matches Colab random.choice([3,5,7]), worst case)
    blurred = cv2.GaussianBlur(img_bgr, (7, 7), 0)

    # Step 2 — Downsample 0.5x then upsample (matches Colab scale=0.5 worst case)
    h, w     = blurred.shape[:2]
    small    = cv2.resize(blurred, (int(w * 0.5), int(h * 0.5)))
    restored = cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)

    # Back to RGB
    lq_rgb = cv2.cvtColor(restored, cv2.COLOR_BGR2RGB)
    lq_pil = Image.fromarray(lq_rgb)

    # Step 3 — exact Colab transform: ToPILImage → ToTensor → Normalize
    t = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])
    tensor = t(lq_rgb).unsqueeze(0).to(device)

    return tensor, lq_pil

def tensor_rgb_sigmoid(t):
    arr = t.squeeze().permute(1, 2, 0).cpu().numpy()
    return (np.clip(arr, 0, 1) * 255).astype(np.uint8)

def tensor_rgb_tanh(t):
    arr = t.squeeze().permute(1, 2, 0).cpu().numpy()
    return ((np.clip(arr, -1, 1) + 1) / 2 * 255).astype(np.uint8)

def pil2np(p): return np.array(p.convert("RGB"))
def np2tensor(img): return transforms.ToTensor()(Image.fromarray(img))

def compute_psnr(ref, cmp):
    t1 = np2tensor(ref); t2 = np2tensor(cmp)
    mse = torch.nn.functional.mse_loss(t1, t2)
    if mse == 0: return 100.0
    return round((20 * torch.log10(1.0 / torch.sqrt(mse))).item(), 2)

def compute_ssim(ref, cmp):
    from skimage.metrics import structural_similarity
    t1 = np2tensor(ref).permute(1, 2, 0).numpy()
    t2 = np2tensor(cmp).permute(1, 2, 0).numpy()
    return round(float(structural_similarity(t1, t2, channel_axis=2, data_range=1)), 4)

def img_stats(img_rgb):
    r, g, b = img_rgb[:,:,0], img_rgb[:,:,1], img_rgb[:,:,2]
    return {
        "mean": round(float(img_rgb.mean()), 2),
        "std" : round(float(img_rgb.std()),  2),
        "r"   : round(float(r.mean()), 2),
        "g"   : round(float(g.mean()), 2),
        "b"   : round(float(b.mean()), 2),
    }

# ═══════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "status"        : "Restore-GAN API v2.0",
        "device"        : str(device),
        "active_dataset": active_dataset,
        "ds1_loaded"    : ds1_loaded,
        "ds2_loaded"    : ds2_loaded,
        "ds1_exists"    : ds1_exists,
        "ds2_exists"    : ds2_exists,
    }

@app.get("/model-status")
def model_status():
    return {
        "ds1_loaded"    : ds1_loaded,
        "ds2_loaded"    : ds2_loaded,
        "ds1_exists"    : ds1_exists,
        "ds2_exists"    : ds2_exists,
        "active_dataset": active_dataset,
        "device"        : str(device),
        "any_loaded"    : active_model is not None,
    }

@app.post("/load-model")
def load_model_endpoint(dataset: str = Form(...)):
    """Switch active model. Called by frontend when user clicks DS1 or DS2 card."""
    if dataset not in ("ds1", "ds2"):
        return JSONResponse({"error": "dataset must be ds1 or ds2"}, status_code=400)

    path = DS1_PATH if dataset == "ds1" else DS2_PATH
    if not os.path.exists(path):
        return JSONResponse({
            "success"   : False,
            "message"   : f"Model file not found: {os.path.basename(path)}",
            "ds1_loaded": ds1_loaded,
            "ds2_loaded": ds2_loaded,
        })

    ok, msg = load_model(dataset)
    return {
        "success"       : ok,
        "message"       : msg,
        "active_dataset": active_dataset,
        "ds1_loaded"    : ds1_loaded,
        "ds2_loaded"    : ds2_loaded,
    }

@app.post("/enhance")
async def enhance(
    file      : UploadFile = File(...),
    dataset   : str        = Form("ds1"),
    threshold : int        = Form(300),
):
    t0 = time.time()

    # auto-load correct model if not already loaded
    if active_dataset != dataset:
        ok, msg = load_model(dataset)
        if not ok:
            return JSONResponse({"error": f"Could not load {dataset} model: {msg}"}, status_code=500)

    if active_model is None:
        return JSONResponse({"error": "No model loaded."}, status_code=500)

    raw     = await file.read()
    pil_img = Image.open(io.BytesIO(raw)).convert("RGB")

    disp = pil_img.copy(); disp.thumbnail((300, 300), Image.LANCZOS)
    original_b64 = to_b64(np.array(disp.convert("RGB")))
    orig_size    = f"{pil_img.width}×{pil_img.height}"

    use_ds2    = (active_dataset == "ds2")
    model_name = "NCT Colorectal Texture (DS2)" if use_ds2 else "Histopathologic Cancer Detection (DS1)"
    model_file = "generator_epoch_15.pth"      if use_ds2 else "restoregan_generator.pth"

    inp, lq_pil = make_lq_ds2(pil_img) if use_ds2 else make_lq_ds1(pil_img)
    lq_rgb      = pil2np(lq_pil)
    lq_bgr      = cv2.cvtColor(lq_rgb, cv2.COLOR_RGB2BGR)
    blurred_b64 = to_b64(lq_rgb)
    score       = blur_score(lq_bgr)

    hq_96   = np.array(pil_img.resize((96, 96), Image.BILINEAR))
    psnr_lq = compute_psnr(hq_96, lq_rgb)
    ssim_lq = compute_ssim(hq_96, lq_rgb)

    elapsed = lambda: round((time.time() - t0) * 1000)

    if score >= threshold:
        return {
            "blur_score":round(score,2), "threshold":threshold, "enhanced":False,
            "dataset":active_dataset, "model_name":model_name, "model_file":model_file,
            "decision":f"Image is already sharp (score {score:.1f} >= {threshold}). Returned original.",
            "original":original_b64, "blurred":blurred_b64, "result":original_b64,
            "orig_size":orig_size,
            "psnr_lq":psnr_lq, "ssim_lq":ssim_lq,
            "psnr_hq":None, "ssim_hq":None, "psnr_gain":None, "ssim_gain":None,
            "stats_lq":img_stats(lq_rgb), "stats_hq":None, "elapsed_ms":elapsed()
        }

    with torch.no_grad():
        out = active_model(inp)

    result_rgb = tensor_rgb_tanh(out) if use_ds2 else tensor_rgb_sigmoid(out)
    result_b64 = to_b64(result_rgb)

    psnr_hq   = compute_psnr(hq_96, result_rgb)
    ssim_hq   = compute_ssim(hq_96, result_rgb)
    psnr_gain = round(psnr_hq - psnr_lq, 2)
    ssim_gain = round(ssim_hq - ssim_lq, 4)

    return {
        "blur_score":round(score,2), "threshold":threshold, "enhanced":True,
        "dataset":active_dataset, "model_name":model_name, "model_file":model_file,
        "decision":f"Blurry image detected (score {score:.1f} < {threshold}). Enhanced with {model_name}.",
        "original":original_b64, "blurred":blurred_b64, "result":result_b64,
        "orig_size":orig_size,
        "psnr_lq":psnr_lq, "ssim_lq":ssim_lq,
        "psnr_hq":psnr_hq, "ssim_hq":ssim_hq,
        "psnr_gain":psnr_gain, "ssim_gain":ssim_gain,
        "stats_lq":img_stats(lq_rgb), "stats_hq":img_stats(result_rgb),
        "elapsed_ms":elapsed()
    }