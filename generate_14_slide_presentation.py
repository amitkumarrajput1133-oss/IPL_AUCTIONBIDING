import os
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

os.makedirs("presentation_assets_master", exist_ok=True)

# -----------------------------------------------------------------------------
# PALETTE DEFINITIONS (Modern Clean / Light Mode Theme)
# -----------------------------------------------------------------------------
# Background: Pure Slate #F8FAFC
# Card Background: Crisp White #FFFFFF
# Card Border: Slate Light #CBD5E1
# Text Headings: Charcoal / Dark Slate #0F172A
# Text Muted: Slate 600 #475569
# Primary Accent: Deep Indigo #4F46E5
# Secondary Accent: Sapphire #0284C7
# Accent 3: Emerald #059669
# Accent 4: Amber / Gold #D97706
# Accent 5: Rose #E11D48
# Accent 6: Purple #7C3AED

FIG_BG = "#F8FAFC"
BOX_BG = "#FFFFFF"
BORDER_DEFAULT = "#CBD5E1"
TEXT_MAIN = "#0F172A"
TEXT_SUB = "#475569"

INDIGO = "#4F46E5"
SAPPHIRE = "#0284C7"
EMERALD = "#059669"
AMBER = "#D97706"
ROSE = "#E11D48"
PURPLE = "#7C3AED"

# -----------------------------------------------------------------------------
# GRAPHICS GENERATOR 1: 4-Tier Architecture Diagram (Slide 2)
# -----------------------------------------------------------------------------
def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 5.8), dpi=300)
    fig.patch.set_facecolor(FIG_BG)
    ax.set_facecolor(FIG_BG)
    
    # Tier 1
    box_c = patches.FancyBboxPatch((0.4, 3.2), 2.5, 2.2, boxstyle="round,pad=0.12", ec=SAPPHIRE, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_c)
    ax.text(1.65, 5.1, "TIER 1: FRONTEND SPA", color=SAPPHIRE, fontsize=10.5, fontweight='bold', ha='center')
    ax.text(1.65, 4.15, "• React 18 + Vite SPA\n• Responsive Light Theme\n• SockJS / STOMP Client\n• Real-Time Subscriptions\n• Modular Component Tree", 
            color=TEXT_SUB, fontsize=8.5, ha='center', va='center', linespacing=1.35)

    # Tier 2
    box_g = patches.FancyBboxPatch((3.2, 3.2), 2.6, 2.2, boxstyle="round,pad=0.12", ec=AMBER, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_g)
    ax.text(4.5, 5.1, "TIER 2: SECURITY LAYER", color=AMBER, fontsize=10.5, fontweight='bold', ha='center')
    ax.text(4.5, 4.15, "• Spring Security 6\n• Stateless JWT Filter\n• HMAC-SHA256 Signatures\n• WS Handshake Interceptor\n• RBAC Authorization", 
            color=TEXT_SUB, fontsize=8.5, ha='center', va='center', linespacing=1.35)

    # Tier 3
    box_e = patches.FancyBboxPatch((6.1, 3.2), 2.6, 2.2, boxstyle="round,pad=0.12", ec=ROSE, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_e)
    ax.text(7.4, 5.1, "TIER 3: CORE BACKEND", color=ROSE, fontsize=10.5, fontweight='bold', ha='center')
    ax.text(7.4, 4.15, "• Spring Boot 3 Engine\n• Pessimistic Lock Engine\n• Purse Bounds Checker\n• Global Exception Handler\n• In-Memory STOMP Broker", 
            color=TEXT_SUB, fontsize=8.5, ha='center', va='center', linespacing=1.35)

    # Tier 4
    box_db = patches.FancyBboxPatch((9.0, 3.2), 2.1, 2.2, boxstyle="round,pad=0.12", ec=EMERALD, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_db)
    ax.text(10.05, 5.1, "TIER 4: DATABASE", color=EMERALD, fontsize=10.5, fontweight='bold', ha='center')
    ax.text(10.05, 4.15, "• MySQL 8 / H2 In-Mem\n• Spring Data JPA\n• Row-Level DB Locks\n• Foreign Keys & Cascades\n• Seed Data Catalog", 
            color=TEXT_SUB, fontsize=8.5, ha='center', va='center', linespacing=1.35)

    # Bottom Pipeline Card
    box_pipe = patches.FancyBboxPatch((0.4, 0.5), 10.7, 2.0, boxstyle="round,pad=0.12", ec=INDIGO, fc=BOX_BG, lw=1.8)
    ax.add_patch(box_pipe)
    ax.text(5.75, 2.15, "END-TO-END EVENT FLOW & ZERO-LATENCY DATA BUS", color=INDIGO, fontsize=11, fontweight='bold', ha='center')
    ax.text(5.75, 1.25, "[1] Client Places Bid -> [2] JWT Authenticated -> [3] Pessimistic Row Lock Acquired on Player & Team\n[4] Purse & Roster Validated -> [5] Atomic SQL Commit -> [6] STOMP Broadcast to /topic/bids in <50ms", 
            color=TEXT_MAIN, fontsize=8.8, ha='center', va='center', linespacing=1.45)

    # Connectors
    ax.annotate('', xy=(3.15, 4.3), xytext=(2.95, 4.3), arrowprops=dict(arrowstyle="<->", color=SAPPHIRE, lw=2))
    ax.annotate('', xy=(6.05, 4.3), xytext=(5.85, 4.3), arrowprops=dict(arrowstyle="<->", color=AMBER, lw=2))
    ax.annotate('', xy=(8.95, 4.3), xytext=(8.75, 4.3), arrowprops=dict(arrowstyle="<->", color=EMERALD, lw=2))

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 5.8)
    ax.axis('off')
    plt.tight_layout()
    output_path = "presentation_assets_master/diag_architecture.png"
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    return output_path

# -----------------------------------------------------------------------------
# GRAPHICS GENERATOR 2: Member 1 Backend & REST Workflow (Slide 4)
# -----------------------------------------------------------------------------
def generate_member1_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 5.5), dpi=300)
    fig.patch.set_facecolor(FIG_BG)
    ax.set_facecolor(FIG_BG)

    steps = [
        ("REST Endpoint", "POST /api/bids/place\nReceives BidRequest DTO\nValidates incoming JSON", SAPPHIRE, 0.5),
        ("Controller Layer", "BidController.java\nDelegates to BidService\nHandles Response Entities", INDIGO, 3.2),
        ("Business Service", "BidService.java\nChecks minimum increment\nVerifies purse > nextBid", PURPLE, 5.9),
        ("Exception Handler", "@RestControllerAdvice\nCatches Business Exceptions\nReturns HTTP 400 Bad Request", ROSE, 8.6)
    ]

    for title, desc, col, x in steps:
        box = patches.FancyBboxPatch((x, 1.8), 2.4, 2.8, boxstyle="round,pad=0.15", ec=col, fc=BOX_BG, lw=2.0)
        ax.add_patch(box)
        ax.text(x + 1.2, 4.2, title, color=col, fontsize=10.5, fontweight='bold', ha='center')
        ax.text(x + 1.2, 3.0, desc, color=TEXT_SUB, fontsize=8.5, ha='center', va='center', linespacing=1.4)

    # Arrows between boxes
    ax.annotate('', xy=(3.15, 3.2), xytext=(2.95, 3.2), arrowprops=dict(arrowstyle="->", color=SAPPHIRE, lw=2.5))
    ax.annotate('', xy=(5.85, 3.2), xytext=(5.65, 3.2), arrowprops=dict(arrowstyle="->", color=INDIGO, lw=2.5))
    ax.annotate('', xy=(8.55, 3.2), xytext=(8.35, 3.2), arrowprops=dict(arrowstyle="->", color=PURPLE, lw=2.5))

    # Bottom summary box
    box_sub = patches.FancyBboxPatch((0.5, 0.4), 10.5, 1.0, boxstyle="round,pad=0.1", ec=EMERALD, fc=BOX_BG, lw=1.8)
    ax.add_patch(box_sub)
    ax.text(5.75, 0.9, "Key Deliverables: Team & Player Management APIs | Transaction Rollback Guarantee | Clean Error Codes", 
            color=EMERALD, fontsize=9.5, fontweight='bold', ha='center')

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 5.5)
    ax.axis('off')
    plt.tight_layout()
    output_path = "presentation_assets_master/diag_member1_backend.png"
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    return output_path

# -----------------------------------------------------------------------------
# GRAPHICS GENERATOR 3: Member 2 Security & JWT Flow (Slide 6)
# -----------------------------------------------------------------------------
def generate_member2_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 5.5), dpi=300)
    fig.patch.set_facecolor(FIG_BG)
    ax.set_facecolor(FIG_BG)

    nodes = [
        ("1. User Login", "Franchise Owner submits credentials\nPOST /api/auth/login", AMBER, 0.5, 3.0),
        ("2. JWT Generation", "TokenUtil signs claims with HMAC-256\nEmbeds franchiseId & user role", EMERALD, 4.3, 3.0),
        ("3. Auth Response", "Returns signed Bearer Token\nStored in sessionStorage", SAPPHIRE, 8.0, 3.0),
        ("4. HTTP Auth Filter", "TokenAuthenticationFilter extracts Bearer\nSets SecurityContext on each call", INDIGO, 1.8, 0.6),
        ("5. WebSocket Guard", "WebSocketSecurityInterceptor verifies token\non CONNECT STOMP frame", ROSE, 6.5, 0.6)
    ]

    for title, desc, col, x, y in nodes:
        box = patches.FancyBboxPatch((x, y), 3.0, 1.8, boxstyle="round,pad=0.12", ec=col, fc=BOX_BG, lw=1.8)
        ax.add_patch(box)
        ax.text(x + 1.5, y + 1.45, title, color=col, fontsize=10, fontweight='bold', ha='center')
        ax.text(x + 1.5, y + 0.75, desc, color=TEXT_SUB, fontsize=8.2, ha='center', va='center', linespacing=1.3)

    # Connections
    ax.annotate('', xy=(4.25, 3.9), xytext=(3.55, 3.9), arrowprops=dict(arrowstyle="->", color=AMBER, lw=2.2))
    ax.annotate('', xy=(7.95, 3.9), xytext=(7.35, 3.9), arrowprops=dict(arrowstyle="->", color=EMERALD, lw=2.2))
    ax.annotate('', xy=(3.3, 2.45), xytext=(3.3, 2.95), arrowprops=dict(arrowstyle="->", color=SAPPHIRE, lw=2))
    ax.annotate('', xy=(8.0, 2.45), xytext=(8.0, 2.95), arrowprops=dict(arrowstyle="->", color=SAPPHIRE, lw=2))

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 5.5)
    ax.axis('off')
    plt.tight_layout()
    output_path = "presentation_assets_master/diag_member2_security.png"
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    return output_path

# -----------------------------------------------------------------------------
# GRAPHICS GENERATOR 4: Member 3 Concurrency & Lock Diagram (Slide 8)
# -----------------------------------------------------------------------------
def generate_member3_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 5.5), dpi=300)
    fig.patch.set_facecolor(FIG_BG)
    ax.set_facecolor(FIG_BG)

    # Team A & Team B concurrent attempts
    box_a = patches.FancyBboxPatch((0.5, 3.4), 3.0, 1.6, boxstyle="round,pad=0.12", ec=AMBER, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_a)
    ax.text(2.0, 4.6, "CSK Owner: ₹12.50 Cr", color=AMBER, fontsize=10, fontweight='bold', ha='center')
    ax.text(2.0, 3.9, "Clicks BID at T = 00.001s\nAcquires DB Lock FIRST", color=TEXT_SUB, fontsize=8.2, ha='center')

    box_b = patches.FancyBboxPatch((0.5, 1.2), 3.0, 1.6, boxstyle="round,pad=0.12", ec=SAPPHIRE, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_b)
    ax.text(2.0, 2.4, "MI Owner: ₹12.50 Cr", color=SAPPHIRE, fontsize=10, fontweight='bold', ha='center')
    ax.text(2.0, 1.7, "Clicks BID at T = 00.002s\nQueued behind DB Lock", color=TEXT_SUB, fontsize=8.2, ha='center')

    # Central DB Pessimistic Lock Engine
    box_lock = patches.FancyBboxPatch((4.4, 1.2), 3.4, 3.8, boxstyle="round,pad=0.15", ec=EMERALD, fc=BOX_BG, lw=2.2)
    ax.add_patch(box_lock)
    ax.text(6.1, 4.6, "PESSIMISTIC WRITE LOCK", color=EMERALD, fontsize=11, fontweight='bold', ha='center')
    ax.text(6.1, 3.8, "@Lock(LockModeType.PESSIMISTIC_WRITE)\nSELECT * FROM players WHERE id=1 FOR UPDATE;", color=INDIGO, fontsize=7.5, ha='center', family='monospace')
    ax.text(6.1, 2.5, "1. Serializes concurrent bids\n2. Deducts Purse balance safely\n3. Updates currentBid & teamId\n4. Releases lock & Commits", color=TEXT_SUB, fontsize=8.2, ha='center', linespacing=1.3)

    # Result Box
    box_res = patches.FancyBboxPatch((8.6, 1.2), 2.5, 3.8, boxstyle="round,pad=0.12", ec=ROSE, fc=BOX_BG, lw=2.0)
    ax.add_patch(box_res)
    ax.text(9.85, 4.6, "TRANSACTION OUTCOME", color=ROSE, fontsize=10, fontweight='bold', ha='center')
    ax.text(9.85, 3.6, "CSK Bid: ACCEPTED\nNew Price: ₹12.50 Cr\nPurse Deducted", color=EMERALD, fontsize=8.2, ha='center', linespacing=1.3)
    ax.text(9.85, 2.1, "MI Bid: REJECTED\nReason: Bid too low\nMust bid >= ₹13.00 Cr", color=ROSE, fontsize=8.2, ha='center', linespacing=1.3)

    # Connectors
    ax.annotate('', xy=(4.35, 4.2), xytext=(3.55, 4.2), arrowprops=dict(arrowstyle="->", color=AMBER, lw=2.2))
    ax.annotate('', xy=(4.35, 2.0), xytext=(3.55, 2.0), arrowprops=dict(arrowstyle="->", color=SAPPHIRE, lw=2.2))
    ax.annotate('', xy=(8.55, 3.1), xytext=(7.85, 3.1), arrowprops=dict(arrowstyle="->", color=EMERALD, lw=2.2))

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 5.5)
    ax.axis('off')
    plt.tight_layout()
    output_path = "presentation_assets_master/diag_member3_concurrency.png"
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    return output_path

# -----------------------------------------------------------------------------
# GRAPHICS GENERATOR 5: Member 4 UI Component Showcase (Slide 10)
# -----------------------------------------------------------------------------
def generate_member4_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 5.5), dpi=300)
    fig.patch.set_facecolor(FIG_BG)
    ax.set_facecolor(FIG_BG)

    comps = [
        ("PlayerCard.jsx", "Active Player Image & Badge\nBase Price vs Current Bid\nCountdown Hammer Timer", SAPPHIRE, 0.5, 3.0),
        ("BiddingConsole.jsx", "Quick Increment Buttons\n(+20L, +50L, +1.00 Cr)\nAuto-Disabled on Low Purse", AMBER, 4.3, 3.0),
        ("Leaderboard.jsx", "10 Franchises Purse Bars\nPlayers Acquired Count\nOverseas Quota Slot Fill (≤8)", EMERALD, 8.0, 3.0),
        ("OrbitArena.jsx", "Stadium Stage Component\nLive Bid Visual Waves\nActive Bidder Spotlight", PURPLE, 0.5, 0.6),
        ("PlayerAnalytics.js", "Strike Rate & Economy Stats\nRadar Charts & Valuation\nForm & Impact Metric Score", ROSE, 4.3, 0.6),
        ("Theme Engine", "Dynamic CSS Variables\nClean Multi-Franchise Branding\nPolished Slate Layout", INDIGO, 8.0, 0.6)
    ]

    for title, desc, col, x, y in comps:
        box = patches.FancyBboxPatch((x, y), 3.0, 1.9, boxstyle="round,pad=0.12", ec=col, fc=BOX_BG, lw=1.8)
        ax.add_patch(box)
        ax.text(x + 1.5, y + 1.55, title, color=col, fontsize=10, fontweight='bold', ha='center')
        ax.text(x + 1.5, y + 0.8, desc, color=TEXT_SUB, fontsize=8.0, ha='center', va='center', linespacing=1.3)

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 5.5)
    ax.axis('off')
    plt.tight_layout()
    output_path = "presentation_assets_master/diag_member4_ui.png"
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    return output_path

# -----------------------------------------------------------------------------
# GRAPHICS GENERATOR 6: Member 5 WebSockets & QA Pipeline (Slide 12)
# -----------------------------------------------------------------------------
def generate_member5_diagram():
    fig, ax = plt.subplots(figsize=(11.5, 5.5), dpi=300)
    fig.patch.set_facecolor(FIG_BG)
    ax.set_facecolor(FIG_BG)

    boxes = [
        ("STOMP Broker", "Spring In-Memory Broker\nTopic /topic/bids\nTopic /topic/players", SAPPHIRE, 0.5, 3.0),
        ("Sub-50ms Fan-Out", "Instant WebSocket Broadcast\nAll 10 Franchise Clients sync\nZero polling overhead", EMERALD, 4.3, 3.0),
        ("OpenAPI 3 / Swagger", "Interactive API Docs\nAvailable at /swagger-ui\nFull Schema Definitions", AMBER, 8.0, 3.0),
        ("JUnit 5 & Mockito", "Automated Service Test Suites\nBidServiceTest.java\nPlayerServiceTest.java", PURPLE, 0.5, 0.6),
        ("Edge Case Testing", "Negative purse prevention\nDuplicate bid rejection\nOut-of-turn finalization", ROSE, 4.3, 0.6),
        ("Postman Test Suite", "Full collection exported\nAutomated CI assertions\nEnvironment token chaining", INDIGO, 8.0, 0.6)
    ]

    for title, desc, col, x, y in boxes:
        box = patches.FancyBboxPatch((x, y), 3.0, 1.9, boxstyle="round,pad=0.12", ec=col, fc=BOX_BG, lw=1.8)
        ax.add_patch(box)
        ax.text(x + 1.5, y + 1.55, title, color=col, fontsize=10, fontweight='bold', ha='center')
        ax.text(x + 1.5, y + 0.8, desc, color=TEXT_SUB, fontsize=8.0, ha='center', va='center', linespacing=1.3)

    ax.annotate('', xy=(4.25, 3.95), xytext=(3.55, 3.95), arrowprops=dict(arrowstyle="->", color=SAPPHIRE, lw=2.2))
    ax.annotate('', xy=(7.95, 3.95), xytext=(7.35, 3.95), arrowprops=dict(arrowstyle="->", color=EMERALD, lw=2.2))

    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 5.5)
    ax.axis('off')
    plt.tight_layout()
    output_path = "presentation_assets_master/diag_member5_websockets.png"
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    return output_path

# Run all diagram generators
print("Regenerating Diagrams with Modern Clean Light Theme...")
diag_arch = generate_architecture_diagram()
diag_m1 = generate_member1_diagram()
diag_m2 = generate_member2_diagram()
diag_m3 = generate_member3_diagram()
diag_m4 = generate_member4_diagram()
diag_m5 = generate_member5_diagram()
print("Diagrams successfully regenerated.")

# -----------------------------------------------------------------------------
# PPTX BUILDER (14 SLIDES - MODERN CLEAN LIGHT THEME)
# -----------------------------------------------------------------------------
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

blank_layout = prs.slide_layouts[6]

# PPTX Color Mapping
COLOR_BG = RGBColor(248, 250, 252)        # Slate 50 (#F8FAFC)
COLOR_CARD_BG = RGBColor(255, 255, 255)   # Pure White (#FFFFFF)
COLOR_CARD_BORDER = RGBColor(203, 213, 225) # Slate 300 (#CBD5E1)
COLOR_TEXT_MAIN = RGBColor(15, 23, 42)    # Slate 900 (#0F172A)
COLOR_TEXT_MUTED = RGBColor(71, 85, 105)  # Slate 600 (#475569)

COLOR_INDIGO = RGBColor(79, 70, 229)      # Deep Indigo (#4F46E5)
COLOR_SAPPHIRE = RGBColor(2, 132, 199)    # Sapphire (#0284C7)
COLOR_EMERALD = RGBColor(5, 150, 105)     # Emerald (#059669)
COLOR_AMBER = RGBColor(217, 119, 6)       # Amber (#D97706)
COLOR_ROSE = RGBColor(225, 29, 72)        # Rose (#E11D48)
COLOR_PURPLE = RGBColor(124, 58, 237)     # Purple (#7C3AED)

def set_slide_background(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = COLOR_BG

def add_header(slide, title_text, category_text, accent_color=COLOR_INDIGO):
    # Category / Tag
    tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
    tf_cat = tb_cat.text_frame
    tf_cat.word_wrap = True
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = category_text.upper()
    p_cat.font.size = Pt(10)
    p_cat.font.bold = True
    p_cat.font.color.rgb = accent_color

    # Main Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.7))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title_text
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_TEXT_MAIN

# -----------------------------------------------------------------------------
# SLIDE 1: Title Slide & Project Introduction
# -----------------------------------------------------------------------------
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1)

# Large Decorative Card
card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(0.8), Inches(11.333), Inches(5.9))
card.fill.solid()
card.fill.fore_color.rgb = COLOR_CARD_BG
card.line.color.rgb = COLOR_INDIGO
card.line.width = Pt(2)

tb = slide1.shapes.add_textbox(Inches(1.4), Inches(1.2), Inches(10.5), Inches(5.0))
tf = tb.text_frame
tf.word_wrap = True

p1 = tf.paragraphs[0]
p1.text = "🏏 REAL-TIME IPL MEGA AUCTION SYSTEM"
p1.font.size = Pt(28)
p1.font.bold = True
p1.font.color.rgb = COLOR_INDIGO

p2 = tf.add_paragraph()
p2.text = "A Distributed, High-Concurrency Financial Auction Simulation Platform"
p2.font.size = Pt(16)
p2.font.color.rgb = COLOR_SAPPHIRE
p2.space_after = Pt(20)

p3 = tf.add_paragraph()
p3.text = "Key Project Highlights:"
p3.font.size = Pt(14)
p3.font.bold = True
p3.font.color.rgb = COLOR_TEXT_MAIN

bullets = [
    "Simulates real-world IPL Mega Auction with 10 official franchises and marquee players.",
    "Real-Time sub-50ms live bidding synchronized via STOMP WebSockets.",
    "Zero Race Conditions guaranteed using Pessimistic Database Row Locking (@Lock).",
    "Stateless Security Architecture powered by Spring Security 6 & HMAC-SHA256 JWT.",
    "Modern clean UI with real-time purse meters, live bidding cards, and player analytics radar."
]
for b in bullets:
    p = tf.add_paragraph()
    p.text = "  •  " + b
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(6)

p4 = tf.add_paragraph()
p4.text = "\nTeam: 5-Member Specialized Engineering Group  |  Stack: Java 17, Spring Boot 3, React Vite, MySQL / H2"
p4.font.size = Pt(12)
p4.font.bold = True
p4.font.color.rgb = COLOR_EMERALD

# -----------------------------------------------------------------------------
# SLIDE 2: Problem Statement & System Architecture
# -----------------------------------------------------------------------------
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2)
add_header(slide2, "Project Overview: Problem Statement & 4-Tier Architecture", "SYSTEM DESIGN & PURPOSE", COLOR_INDIGO)
slide2.shapes.add_picture(diag_arch, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))

# -----------------------------------------------------------------------------
# SLIDE 3: Member 1 - Role & Core Backend Work
# -----------------------------------------------------------------------------
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3)
add_header(slide3, "Member 1: Project Lead & Core Backend Architect", "TEAM MEMBER 1 OF 5", COLOR_INDIGO)

# Left Card: Responsibilities & Implementation
card_m1_l = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m1_l.fill.solid()
card_m1_l.fill.fore_color.rgb = COLOR_CARD_BG
card_m1_l.line.color.rgb = COLOR_INDIGO
card_m1_l.line.width = Pt(1.5)

tb_m1_l = slide3.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m1_l = tb_m1_l.text_frame
tf_m1_l.word_wrap = True

p = tf_m1_l.paragraphs[0]
p.text = "Role & Core Responsibilities"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_INDIGO

m1_items = [
    "System Orchestration: Defined communication contracts between backend and client.",
    "REST Controller Architecture: Built Player, Team, and Auction lifecycle endpoints.",
    "Global Exception Handling: Implemented @RestControllerAdvice for structured JSON error payloads.",
    "Purse Bounds Checker: Enforces minimum purse reserve and max squad quota (25 players).",
    "Build Automation: Maintained Maven pom.xml and multi-module configurations."
]
for item in m1_items:
    p = tf_m1_l.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

# Right Card: Tech Used & Why
card_m1_r = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m1_r.fill.solid()
card_m1_r.fill.fore_color.rgb = COLOR_CARD_BG
card_m1_r.line.color.rgb = COLOR_CARD_BORDER
card_m1_r.line.width = Pt(1.5)

tb_m1_r = slide3.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m1_r = tb_m1_r.text_frame
tf_m1_r.word_wrap = True

p = tf_m1_r.paragraphs[0]
p.text = "Technology Used & Technical Justification"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_SAPPHIRE

m1_tech = [
    "Java 17 (LTS): Used modern sealed records, pattern matching, and superior garbage collection throughput.",
    "Spring Boot 3.2: Enterprise dependency injection, clean modular controllers, and auto-configured runtime.",
    "Spring MVC REST: Standardized JSON API contracts with HTTP response codes (200 OK, 400 Bad Request).",
    "Transactional Boundaries: @Transactional ensures ACID properties across all player transfers and purse updates."
]
for item in m1_tech:
    p = tf_m1_r.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

# -----------------------------------------------------------------------------
# SLIDE 4: Member 1 - Workflow & Request Lifecycle Diagram
# -----------------------------------------------------------------------------
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4)
add_header(slide4, "Member 1: REST API & Request Lifecycle Architecture", "WORKFLOW & CODE IMPLEMENTATION", COLOR_INDIGO)
slide4.shapes.add_picture(diag_m1, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))

# -----------------------------------------------------------------------------
# SLIDE 5: Member 2 - Role & Security Work
# -----------------------------------------------------------------------------
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5)
add_header(slide5, "Member 2: Security & Authentication Specialist", "TEAM MEMBER 2 OF 5", COLOR_AMBER)

card_m2_l = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m2_l.fill.solid()
card_m2_l.fill.fore_color.rgb = COLOR_CARD_BG
card_m2_l.line.color.rgb = COLOR_AMBER
card_m2_l.line.width = Pt(1.5)

tb_m2_l = slide5.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m2_l = tb_m2_l.text_frame
tf_m2_l.word_wrap = True

p = tf_m2_l.paragraphs[0]
p.text = "Role & Security Scope"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_AMBER

m2_items = [
    "Zero-Trust Identity: Ensured no franchise can bid or view private data without authentication.",
    "Stateless Token Architecture: Replaced heavy server sessions with lightweight cryptographic JWTs.",
    "Custom Filter Chain: TokenAuthenticationFilter parses Bearer tokens on every incoming request.",
    "WebSocket Interceptor: WebSocketSecurityInterceptor inspects STOMP CONNECT frames.",
    "Credential Protection: BCrypt password hashing prevents password leaks."
]
for item in m2_items:
    p = tf_m2_l.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

card_m2_r = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m2_r.fill.solid()
card_m2_r.fill.fore_color.rgb = COLOR_CARD_BG
card_m2_r.line.color.rgb = COLOR_CARD_BORDER
card_m2_r.line.width = Pt(1.5)

tb_m2_r = slide5.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m2_r = tb_m2_r.text_frame
tf_m2_r.word_wrap = True

p = tf_m2_r.paragraphs[0]
p.text = "Technology Used & Why"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_INDIGO

m2_tech = [
    "Spring Security 6: Clean security filter chain customization with lambda DSL syntax.",
    "JWT with HMAC-SHA256: Self-contained token payload holding username, role, and franchise ID with zero database query overhead per request.",
    "CORS & CSRF Management: Configured granular CORS allowances for Vite dev ports while disabling CSRF for REST APIs.",
    "Role-Based Access Control: Granular authority mapping for ADMIN (Auctioneer) vs USER (Franchise Owner)."
]
for item in m2_tech:
    p = tf_m2_r.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

# -----------------------------------------------------------------------------
# SLIDE 6: Member 2 - JWT & WebSocket Security Workflow
# -----------------------------------------------------------------------------
slide6 = prs.slides.add_slide(blank_layout)
set_slide_background(slide6)
add_header(slide6, "Member 2: JWT Authentication & WebSocket Guard Flow", "WORKFLOW & CODE IMPLEMENTATION", COLOR_AMBER)
slide6.shapes.add_picture(diag_m2, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))

# -----------------------------------------------------------------------------
# SLIDE 7: Member 3 - Role & Database Concurrency Work
# -----------------------------------------------------------------------------
slide7 = prs.slides.add_slide(blank_layout)
set_slide_background(slide7)
add_header(slide7, "Member 3: Database Schema & Concurrency Developer", "TEAM MEMBER 3 OF 5", COLOR_EMERALD)

card_m3_l = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m3_l.fill.solid()
card_m3_l.fill.fore_color.rgb = COLOR_CARD_BG
card_m3_l.line.color.rgb = COLOR_EMERALD
card_m3_l.line.width = Pt(1.5)

tb_m3_l = slide7.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m3_l = tb_m3_l.text_frame
tf_m3_l.word_wrap = True

p = tf_m3_l.paragraphs[0]
p.text = "Role & Data Layer Scope"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_EMERALD

m3_items = [
    "Database Entity Modeling: Designed relational tables for Player, Team, User, Bid, and Auction.",
    "Pessimistic Concurrency Engine: Eliminates race conditions when multiple teams bid simultaneously.",
    "Purse Balance Deduction: Guarantees atomic balance deduction on player finalization.",
    "Data Seeding: Created DataInitializer.java with 10 real IPL franchises and 23 marquee players.",
    "Referential Integrity: Enforced foreign key relationships and cascade rules."
]
for item in m3_items:
    p = tf_m3_l.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

card_m3_r = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m3_r.fill.solid()
card_m3_r.fill.fore_color.rgb = COLOR_CARD_BG
card_m3_r.line.color.rgb = COLOR_CARD_BORDER
card_m3_r.line.width = Pt(1.5)

tb_m3_r = slide7.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m3_r = tb_m3_r.text_frame
tf_m3_r.word_wrap = True

p = tf_m3_r.paragraphs[0]
p.text = "Technology Used & Why"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_SAPPHIRE

m3_tech = [
    "MySQL 8.0 & H2 In-Memory DB: Supports production-grade relational queries with zero-setup in-memory dev mode.",
    "Spring Data JPA & Hibernate: Type-safe repository interfaces with automatic SQL query synthesis.",
    "@Lock(LockModeType.PESSIMISTIC_WRITE): Generates SQL 'SELECT ... FOR UPDATE' to acquire exclusive row locks during bidding.",
    "Data Seeding Suite: Automated bootstrapping ensures testing with realistic IPL player stats and team budgets."
]
for item in m3_tech:
    p = tf_m3_r.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

# -----------------------------------------------------------------------------
# SLIDE 8: Member 3 - Pessimistic Concurrency Workflow
# -----------------------------------------------------------------------------
slide8 = prs.slides.add_slide(blank_layout)
set_slide_background(slide8)
add_header(slide8, "Member 3: Pessimistic Row Locking & Concurrency Flow", "WORKFLOW & CODE IMPLEMENTATION", COLOR_EMERALD)
slide8.shapes.add_picture(diag_m3, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))

# -----------------------------------------------------------------------------
# SLIDE 9: Member 4 - Role & Frontend UI Work
# -----------------------------------------------------------------------------
slide9 = prs.slides.add_slide(blank_layout)
set_slide_background(slide9)
add_header(slide9, "Member 4: Frontend UI & Design Lead", "TEAM MEMBER 4 OF 5", COLOR_PURPLE)

card_m4_l = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m4_l.fill.solid()
card_m4_l.fill.fore_color.rgb = COLOR_CARD_BG
card_m4_l.line.color.rgb = COLOR_PURPLE
card_m4_l.line.width = Pt(1.5)

tb_m4_l = slide9.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m4_l = tb_m4_l.text_frame
tf_m4_l.word_wrap = True

p = tf_m4_l.paragraphs[0]
p.text = "Role & UI Design Scope"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_PURPLE

m4_items = [
    "Clean Slate Theme: Crafted clean, responsive user interface with crisp typography and cards.",
    "Modular Component System: Built PlayerCard, BiddingConsole, Leaderboard, and FranchiseHeader.",
    "Interactive Bidding Controls: Quick-action bid increment buttons (+20L, +50L, +1Cr) with dynamic disable states.",
    "Franchise Theming: Dynamic color tokens for all 10 teams (CSK Yellow, MI Blue, RCB Red).",
    "Visual Data Analytics: Rendered live player strike rate, economy, and purse depletion gauges."
]
for item in m4_items:
    p = tf_m4_l.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

card_m4_r = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m4_r.fill.solid()
card_m4_r.fill.fore_color.rgb = COLOR_CARD_BG
card_m4_r.line.color.rgb = COLOR_CARD_BORDER
card_m4_r.line.width = Pt(1.5)

tb_m4_r = slide9.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m4_r = tb_m4_r.text_frame
tf_m4_r.word_wrap = True

p = tf_m4_r.paragraphs[0]
p.text = "Technology Used & Why"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_SAPPHIRE

m4_tech = [
    "React 18 & Vite: Rapid hot-module replacement and high-performance component re-rendering during rapid bids.",
    "Custom CSS with HSL Tokens: Full flexibility over clean responsive card layouts without CSS framework bloat.",
    "Lucide React Icons: Clean, consistent iconography across header status and navigation panels.",
    "Adaptive Layout: Flexbox and Grid structures optimized for desktop command center and tablet screens."
]
for item in m4_tech:
    p = tf_m4_r.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

# -----------------------------------------------------------------------------
# SLIDE 10: Member 4 - Component Architecture & Showcase
# -----------------------------------------------------------------------------
slide10 = prs.slides.add_slide(blank_layout)
set_slide_background(slide10)
add_header(slide10, "Member 4: Frontend UI Component Architecture", "WORKFLOW & CODE IMPLEMENTATION", COLOR_PURPLE)
slide10.shapes.add_picture(diag_m4, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))

# -----------------------------------------------------------------------------
# SLIDE 11: Member 5 - Role & WebSockets / QA Testing
# -----------------------------------------------------------------------------
slide11 = prs.slides.add_slide(blank_layout)
set_slide_background(slide11)
add_header(slide11, "Member 5: WebSockets, QA Testing & Documentation Lead", "TEAM MEMBER 5 OF 5", COLOR_ROSE)

card_m5_l = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m5_l.fill.solid()
card_m5_l.fill.fore_color.rgb = COLOR_CARD_BG
card_m5_l.line.color.rgb = COLOR_ROSE
card_m5_l.line.width = Pt(1.5)

tb_m5_l = slide11.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m5_l = tb_m5_l.text_frame
tf_m5_l.word_wrap = True

p = tf_m5_l.paragraphs[0]
p.text = "Role & Real-Time / QA Scope"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_ROSE

m5_items = [
    "STOMP WebSocket Integration: Subscribed client to /topic/bids and /topic/players for instant live updates.",
    "OpenAPI 3 / Swagger UI: Created complete interactive API documentation at /swagger-ui/index.html.",
    "Postman Test Suite: Built end-to-end collection with automated assertions and token variables.",
    "Unit & Integration Testing: Developed JUnit 5 and Mockito test suites in BidServiceTest.java.",
    "Edge Case Verification: Validated negative purse scenarios, duplicate bids, and out-of-turn bidding."
]
for item in m5_items:
    p = tf_m5_l.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(8)

card_m5_r = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.3))
card_m5_r.fill.solid()
card_m5_r.fill.fore_color.rgb = COLOR_CARD_BG
card_m5_r.line.color.rgb = COLOR_CARD_BORDER
card_m5_r.line.width = Pt(1.5)

tb_m5_r = slide11.shapes.add_textbox(Inches(7.0), Inches(1.7), Inches(5.3), Inches(4.9))
tf_m5_r = tb_m5_r.text_frame
tf_m5_r.word_wrap = True

p = tf_m5_r.paragraphs[0]
p.text = "Technology Used & Why"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_SAPPHIRE

m5_tech = [
    "SockJS & STOMP: Reliable full-duplex WebSocket connection with automatic HTTP fallback for restricted networks.",
    "Spring-doc OpenAPI 3: Auto-generated OpenAPI specs and interactive Swagger UI directly from Spring Boot annotations.",
    "JUnit 5 & Mockito: Isolated mocking of database repositories to simulate race conditions and budget edge cases.",
    "Postman Collection: Complete regression testing suite for API endpoints."
]
for item in m5_tech:
    p = tf_m5_r.add_paragraph()
    p.text = "• " + item
    p.font.size = Pt(11.5)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(10)

# -----------------------------------------------------------------------------
# SLIDE 12: Member 5 - STOMP Broker & QA Pipeline Diagram
# -----------------------------------------------------------------------------
slide12 = prs.slides.add_slide(blank_layout)
set_slide_background(slide12)
add_header(slide12, "Member 5: STOMP Pub/Sub Broker & QA Test Architecture", "WORKFLOW & CODE IMPLEMENTATION", COLOR_ROSE)
slide12.shapes.add_picture(diag_m5, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))

# -----------------------------------------------------------------------------
# SLIDE 13: Project Impact, Key Achievements & Live Demo Flow
# -----------------------------------------------------------------------------
slide13 = prs.slides.add_slide(blank_layout)
set_slide_background(slide13)
add_header(slide13, "Project Impact, Live Demo Flow & Key Achievements", "PROJECT CONCLUSION & METRICS", COLOR_EMERALD)

cards_data = [
    ("Real-Time Performance", "• Sub-50ms WebSocket broadcast latency.\n• 100% synchronized screen updates.\n• Zero page reloads required.\n• Scalable in-memory STOMP broker.", COLOR_INDIGO, 0.8),
    ("Financial & Data Integrity", "• Zero race conditions with Pessimistic Locking.\n• Strict Rs. 120 Cr purse balance enforcement.\n• Overseas player quota ceiling check (<=8).\n• Full transaction rollback on errors.", COLOR_AMBER, 4.8),
    ("Live Demo Flow", "1. Login as CSK & MI owners on two windows.\n2. Place alternating bids on marquee player.\n3. Observe live purse deduction & leaderboard.\n4. Admin finalizes sale; roster updates instantly.", COLOR_EMERALD, 8.8)
]

for title, desc, col, x in cards_data:
    c = slide13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(1.5), Inches(3.7), Inches(5.3))
    c.fill.solid()
    c.fill.fore_color.rgb = COLOR_CARD_BG
    c.line.color.rgb = col
    c.line.width = Pt(1.5)

    tb = slide13.shapes.add_textbox(Inches(x + 0.2), Inches(1.8), Inches(3.3), Inches(4.8))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = col
    p.space_after = Pt(12)

    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(11)
    p2.font.color.rgb = COLOR_TEXT_MUTED
    p2.line_spacing = 1.4

# -----------------------------------------------------------------------------
# SLIDE 14: Tech Stack References, Tools & Repository
# -----------------------------------------------------------------------------
slide14 = prs.slides.add_slide(blank_layout)
set_slide_background(slide14)
add_header(slide14, "Tech Stack References, Documentation & Repository Links", "REFERENCES & RESOURCES", COLOR_INDIGO)

card_ref = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.3))
card_ref.fill.solid()
card_ref.fill.fore_color.rgb = COLOR_CARD_BG
card_ref.line.color.rgb = COLOR_INDIGO
card_ref.line.width = Pt(1.5)

tb_ref = slide14.shapes.add_textbox(Inches(1.1), Inches(1.7), Inches(11.1), Inches(4.8))
tf_ref = tb_ref.text_frame
tf_ref.word_wrap = True

p = tf_ref.paragraphs[0]
p.text = "Technology Stack, Versioning & Documentation Links"
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = COLOR_INDIGO
p.space_after = Pt(12)

references = [
    ("Backend Framework:", "Spring Boot 3.2.x (Java 17 LTS), Spring Security 6, Spring Data JPA, Spring WebSocket"),
    ("Database & ORM:", "MySQL 8.0, Hibernate ORM, H2 In-Memory Database (MySQL Mode)"),
    ("Frontend Stack:", "React 18.2, Vite 5.x, SockJS Client, StompJS, Lucide React Icons"),
    ("Security & Auth:", "JSON Web Tokens (io.jsonwebtoken / HMAC-SHA256), BCrypt Password Encoder"),
    ("Testing & QA:", "JUnit 5, Mockito, Spring Boot Test, Postman Collection v2.1"),
    ("API Documentation:", "OpenAPI 3 / SpringDoc Swagger UI (/swagger-ui/index.html)"),
    ("Project Workspace:", "GitHub Repository: @srijansrivastava1234/ipl_auction_system | 5-Member Team Structure")
]

for label, val in references:
    p = tf_ref.add_paragraph()
    p.text = f"{label} "
    p.font.size = Pt(11.5)
    p.font.bold = True
    p.font.color.rgb = COLOR_SAPPHIRE
    
    run = p.add_run()
    run.text = val
    run.font.bold = False
    run.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(6)

p_end = tf_ref.add_paragraph()
p_end.text = "\nThank you! Questions & Live Demo session open."
p_end.font.size = Pt(13)
p_end.font.bold = True
p_end.font.color.rgb = COLOR_EMERALD

# Save output with fallback if file is open in PowerPoint
pptx_path = "IPL_Auction_System_14_Slides_Master_Presentation.pptx"
try:
    prs.save(pptx_path)
    print(f"Presentation saved successfully to: {pptx_path}")
except PermissionError:
    alt_path = "IPL_Auction_System_Modern_Light_Presentation.pptx"
    prs.save(alt_path)
    print(f"Original file was open in PowerPoint. Saved updated presentation to: {alt_path}")

