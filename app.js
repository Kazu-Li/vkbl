// mutable settings /////////////////////////////////////////////////////////////////////////////////////////////////

var mode = 0; // 0 - normal, 1 - show/edit black list users

// storage helpers /////////////////////////////////////////////////////////////////////////////////////////////////

function get_stored_black_list() {
    const r = localStorage.getItem('bl');
    return r ? JSON.parse(r) : {};
}

function is_href_in_black_list(href) {
    return Boolean( href && get_stored_black_list()[href] == 1 ); // or !!(....)
}

// avatar click handler /////////////////////////////////////////////////////////////////////////////////////////////////

function avatar_click_handler(event) {
    event.preventDefault();
    event.stopPropagation();
    const e = event.currentTarget;
    if (e && e.href) {
        if (mode == 0) {
            window.location.href = e.href;
        } else {
            var r = get_stored_black_list();
            if (r[e.href]) {
                delete r[e.href];
            } else {
                r[e.href] = 1;
            }
            localStorage.setItem('bl', JSON.stringify(r));
            filter_node(document.body);
        }
    }
}

// util helpers /////////////////////////////////////////////////////////////////////////////////////////////////

function id_starts_with_one_of(e, ...args) {
    if (e.id) for (const arg of args) if (e.id.startsWith(arg)) return true;
    return false;
}

function class_one_of(e, ...args) {
    if (e.classList) for (const arg of args) if (e.classList.contains(arg)) return true;
    return false;
}

// core logic /////////////////////////////////////////////////////////////////////////////////////////////////

function get_cross_sign(e) {
    if (e.children) for (const child of e.children) if (class_one_of(child, 'vkf_cross_sign')) return child;
    return null;
}

function delete_cross_sign(e) {
    var div = get_cross_sign(e);
    if (div) div.remove();

    e.style.position = 'static';
}

function add_cross_sign(e) {
    if (get_cross_sign(e)) return;

    div = document.createElement('div');
    div.classList.add('vkf_cross_sign');
    // div.id =
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.height = '100%';
    div.style.width = '100%';
    div.style.zIndex = 2;
    // div.style.background = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='black' stroke-width='1'/><path d='M0 0 L100 100 ' stroke='black' stroke-width='1'/></svg>\")";
    div.style.background = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' preserveAspectRatio='none' viewBox='0 0 100 100'><path d='M100 0 L0 100 ' stroke='red' stroke-width='10'/><path d='M0 0 L100 100 ' stroke='red' stroke-width='10'/></svg>\")";
    div.style.backgroundRepeat = 'no-repeat';
    div.style.backgroundPosition = 'center center';
    div.style.backgroundSize = '100% 100%, auto';

    e.style.position = 'relative';
    e.appendChild(div);
}

function is_node_author_in_black_list(e) {
    if (e.href && !class_one_of(e, 'ui_zoom_added'   //ui_zoom_outer
                                 , 'feedback_rphoto' // when it near feedback_image
                                )) {
        const in_bl = is_href_in_black_list(e.href);
        if (mode == 1) {
            if (in_bl) add_cross_sign(e); else delete_cross_sign(e);
        }
        if (!class_one_of(e, 'author'
                           , 'fans_fan_lnk'
                           , 'mem_link'
                           , 'people_cell_ava'
                        // , 'group_link'
                          )) {
            if (mode == 1) {
                e.classList.add('vkf_ava_btn');
                if (class_one_of(e, '_im_peer_target' // messenger list item _im_peer_target _online_reader
                                  , 'im_grid'         // chat item
                                 )) {
                    e.classList.add('vkf_pos_abs');
                }
                // if (in_bl) add_cross_sign(e); else delete_cross_sign(e);
            } else {
                e.classList.remove('vkf_ava_btn', 'vkf_pos_abs');
            }
            e.addEventListener('click', avatar_click_handler, false);
        }
        return in_bl;
    }
    if (e.children) for (const child of e.children) {
        const r = is_node_author_in_black_list(child);
        if (r != null) return r;
    }
    return null; // undefined ?
}

function is_node_to_check(e) {
    return id_starts_with_one_of(e, 'post', 'fans_fan_row', 'replies_wrap_deep')
    || class_one_of(e, 'pv_author_block'
                     , 'market_item_owner'
                     , 'like_tt_owner'
                     , 'people_cell'
                     , 'nim-dialog'        // messenger list item
                     , 'feed_row'          // top notify popup item
                     , 'im-mess-stack'     // chat item
                     );
}

// function filter_node(e) {
//     if (is_node_to_check(e) && is_href_in_black_list(user_href(e))) apply_filter(e);
//     else if (e.children) for (const child of e.children) filter_node(child);
// }

function is_node_author_in_black_list_wrapper(e) {
    // hack for supporting replies to post in standalone outside block - vk changed layout
    var post;
    // id="replies_wrap_deep-32544455_6155"
    if (id_starts_with_one_of(e, 'replies_wrap_deep')) {
        // trying to find post element itself, with id="post-32544455_6155"
        post = document.getElementById(e.id.replace('replies_wrap_deep', 'post'));
    }
    return is_node_author_in_black_list(post || e);
}

function filter_node(e) {
    if (is_node_to_check(e))
        if (is_node_author_in_black_list_wrapper(e)) {
            e.classList.add('filtered');
            // if (mode == 0) return; // not needed to go deeper - anyway we'll set display: none to all block
        } else {
            e.classList.remove('filtered');
        }
    if (e.children) for (const child of e.children) filter_node(child);
}

// style helpers /////////////////////////////////////////////////////////////////////////////////////////////////


// const bl_style_normal_mode = '.filtered { opacity: 0.15 !important; }';
// const bl_style_normal_mode = '.filtered { visibility: hidden !important; }';
// const bl_style_normal_mode = '.filtered { background-color: grey !important; }';
// const bl_style_normal_mode = '.filtered {}';
const bl_style_normal_mode = '.filtered { display: none !important; }';

// const bl_style_manage_mode = '.filtered { opacity: 0.7 !important; }';
// const bl_style_manage_mode = '.filtered { background-color: rgba(0, 0, 0, 0.05) !important; }';
const bl_style_manage_mode = '.filtered { text-decoration: line-through !important; }';

function create_add_style_elements() {
    var head = document.head || document.getElementsById('head')[0];

    var style = document.createElement('style');
    style.id = 'vkf_bl_style';
    style.innerHTML = bl_style_normal_mode;
    //style.textContent = bl_style_normal_mode;
    head.appendChild(style);

    style = document.createElement('style');
    style.innerHTML = ' \
    .vkf_ava_btn { background: whitesmoke !important; \
                   border: 1px outset #edeef0 !important; \
                   border-radius: 5% !important; } \
    .vkf_pos_abs { position: absolute !important; } \
    ';
    head.appendChild(style);
}

function set_bl_style(css) {
    var style = document.getElementById('vkf_bl_style');
    style.innerHTML = css;
}

// main calls /////////////////////////////////////////////////////////////////////////////////////////////////

create_add_style_elements();

filter_node(document.body);

const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes) for (const added_node of mutation.addedNodes) filter_node(added_node);
    });
});
observer.observe(document.body, { childList: true, subtree: true });

function doc_hotkey(event) {
        if (event.ctrlKey && event.key === ' ') {
        mode = mode == 0 ? 1 : 0;
        set_bl_style(mode == 0 ? bl_style_normal_mode : bl_style_manage_mode);
        filter_node(document.body);
    }
}
// document.addEventListener('keyup', doc_hotkey, false);
document.addEventListener('keydown', doc_hotkey, false);
