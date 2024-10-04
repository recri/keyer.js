#!/usr/bin/wish

set width 300
set height 50
set thick 0.20
set break1 [expr {20.0/30}]
set break2 [expr {24.0/30}]
set break3 [expr {28.0/30}]
set knob1  [expr {25.0/30}]
set knob2  [expr {30.0/30}]
set contact [expr {16.0/30}]

pack [canvas .c] -side top -fill both -expand true
foreach var {width height thick break1 break2 break3 contact} {
    pack [ttk::frame .$var] -side top
    pack [ttk::label .$var.l -text "$var: "] -side left
    pack [ttk::scale .$var.s -variable $var -orient horizontal -length 400] -side left
    pack [ttk::label .$var.v -textvar $var -width 5] -side left
    if {$var in {width height}} {
	.$var.s configure -from 100 -to 800
    } else {
	.$var.s configure -from 0 -to 1
    }
    .$var.s configure -command [list redraw $var]
}

proc redraw {args} {
    foreach {var val} $args {
	global $var
	if {$var in {width height}} {
	    set $var [format {%.0f} $val]
	} else {
	    set $var [format {%.2f} $val]
	}
    }

    # clean up
    .c delete all

    # scale proportions
    set t [expr {$::height*$::thick}]
    set t2 [expr {$t/2}]
    set b1 [expr {$::width*$::break1}]
    set b2 [expr {$::width*$::break2}]
    set b3 [expr {$::width*$::break3}]
    set k1 [expr {$::width*$::knob1}]
    set k2 [expr {$::width*$::knob2}]
    set c [expr {$::width*$::contact}]

    set yb [expr {$::height-$t}]
    set yt $t2
    set ym [expr {$::height/2}]

    set kc [expr {($k1+$k2)/2}]

    set xc [expr {$c+$t2}]
    set yc1 [expr {$yt+$::height/5.0}]
    set yc2 [expr {$yb-2*$::height/5.0}]

    # bottom line
    .c create line 0 $yb $b1 $yb -width $t -fill blue -capstyle round -tag bottom

    # top line
    .c create line 0 $yt $b1 $yt $b2 $ym $b3 $ym -width $t -fill blue  -capstyle round -tag top

    # key handle
    .c create line $k1 $yt $k2 $yt -width $t -fill blue -capstyle round -tag knob

    .c move all 50 50

    puts [.c coords bottom]
    puts [.c coords top]
    puts [.c coords knob]
    # connect the knob
    # .c create line $kc $yt $kc $ym -width $t -fill blue

    # contacts
    # .c create line $xc $yt $xc $yc1 -width $t -fill blue
    # .c create line $xc $yb $xc $yc2 -width $t -fill blue
}

redraw

