


function showAddContentModal(contentType) {
    const modal = createModal({
        title: `Add ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
        content: getAddContentForm(contentType),
        onSubmit: (formData) => handleAddContent(contentType, formData)
    });
    
    document.body.appendChild(modal);
    initializeFormSelectors(contentType);
}


function showEditContentModal(contentType, itemData) {
    const modal = createModal({
        title: `Edit ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
        content: getEditContentForm(contentType, itemData),
        onSubmit: (formData) => handleEditContent(contentType, itemData.id, formData)
    });
    
    document.body.appendChild(modal);
    initializeFormSelectors(contentType, itemData);
}


function showDeleteConfirmModal(contentType, itemData, onConfirm) {
    const modal = createModal({
        title: 'Confirm Delete',
        content: `
            <p>Are you sure you want to delete this ${contentType}?</p>
            <p class="text-danger">This action cannot be undone.</p>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'btn outline-btn',
                onClick: (modal) => modal.remove()
            },
            {
                text: 'Delete',
                class: 'btn danger-btn',
                onClick: async (modal) => {
                    try {
                        await onConfirm();
                        modal.remove();
                        window.adminCore.showToast(`${contentType} deleted successfully`, 'success');
                    } catch (error) {
                        console.error(`Error deleting ${contentType}:`, error);
                        window.adminCore.showError(`Failed to delete ${contentType}`);
                    }
                }
            }
        ]
    });
    
    document.body.appendChild(modal);
}


function createModal({ title, content, onSubmit, buttons }) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal';
    
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
        <h3>${title}</h3>
        <button class="close-modal" aria-label="Close modal">×</button>
    `;
    
    
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }
    
    
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    if (buttons) {
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = button.class;
            btn.textContent = button.text;
            btn.addEventListener('click', () => button.onClick(modal));
            footer.appendChild(btn);
        });
    } else {
        footer.innerHTML = `
            <button class="btn outline-btn" data-action="cancel">Cancel</button>
            <button class="btn primary-btn" data-action="submit">Save</button>
        `;
    }
    
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    
    
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    if (onSubmit) {
        const submitBtn = modal.querySelector('[data-action="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                const form = modal.querySelector('form');
                if (form && form.checkValidity()) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    try {
                        await onSubmit(data);
                        modal.remove();
                        window.adminCore.showToast('Changes saved successfully', 'success');
                    } catch (error) {
                        console.error('Form submission error:', error);
                        window.adminCore.showError('Failed to save changes');
                    }
                } else if (form) {
                    form.reportValidity();
                }
            });
        }
    }
    
    return modal;
}


function getAddContentForm(contentType) {
    const form = document.createElement('form');
    form.className = 'add-content-form';
    
    switch (contentType) {
        case 'subject':
            form.innerHTML = `
                <div class="form-group">
                    <label for="semester">Semester</label>
                    <select name="semester" id="semester" required>
                        <option value="">Select Semester</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="name">Subject Name</label>
                    <input type="text" name="name" id="name" required>
                </div>
                <div class="form-group">
                    <label for="code">Subject Code</label>
                    <input type="text" name="code" id="code" required>
                </div>
            `;
            break;
            
        case 'note':
            form.innerHTML = `
                <div class="form-group">
                    <label for="semester">Semester</label>
                    <select name="semester" id="semester" required>
                        <option value="">Select Semester</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="subject">Subject</label>
                    <select name="subject" id="subject" required>
                        <option value="">Select Subject</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="title">Title</label>
                    <input type="text" name="title" id="title" required>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea name="description" id="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="link">Google Drive Link</label>
                    <input type="url" name="link" id="link" required pattern="https://drive\\.google\\.com/.*">
                    <small class="form-text text-muted">Must be a valid Google Drive link</small>
                </div>
            `;
            break;
            
        case 'video':
            form.innerHTML = `
                <div class="form-group">
                    <label for="semester">Semester</label>
                    <select name="semester" id="semester" required>
                        <option value="">Select Semester</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="subject">Subject</label>
                    <select name="subject" id="subject" required>
                        <option value="">Select Subject</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="title">Title</label>
                    <input type="text" name="title" id="title" required>
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea name="description" id="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="link">YouTube Link</label>
                    <input type="url" name="link" id="link" required pattern="https://(www\\.)?youtube\\.com/watch\\?v=.*|https://youtu\\.be/.*">
                    <small class="form-text text-muted">Must be a valid YouTube video link</small>
                </div>
            `;
            break;
    }
    
    return form;
}


function getEditContentForm(contentType, itemData) {
    const form = getAddContentForm(contentType);
    
    
    Object.entries(itemData).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = value;
        }
    });
    
    return form;
}


async function initializeFormSelectors(contentType, itemData = null) {
    const form = document.querySelector('.add-content-form, .edit-content-form');
    if (!form) return;
    
    const semesterSelect = form.querySelector('#semester');
    const subjectSelect = form.querySelector('#subject');
    
    
    if (semesterSelect) {
        for (let i = 1; i <= 8; i++) {
            const option = document.createElement('option');
            option.value = `s${i}`;
            option.textContent = `Semester ${i}`;
            semesterSelect.appendChild(option);
        }
        
        if (itemData?.semester) {
            semesterSelect.value = itemData.semester;
        }
    }
    
    
    if (semesterSelect && subjectSelect) {
        semesterSelect.addEventListener('change', () => {
            window.adminCore.loadSubjectsForSemester(semesterSelect.value, subjectSelect);
        });
        
        if (itemData?.semester) {
            await window.adminCore.loadSubjectsForSemester(itemData.semester, subjectSelect);
            if (itemData?.subject) {
                subjectSelect.value = itemData.subject;
            }
        }
    }
}


async function handleAddContent(contentType, formData) {
    try {
        switch (contentType) {
            case 'subject':
                await window.contentManagement.addSubject(formData.semester, {
                    name: formData.name,
                    code: formData.code
                });
                break;
                
            case 'note':
                await window.contentManagement.addNote(formData.semester, formData.subject, {
                    title: formData.title,
                    description: formData.description,
                    link: formData.link
                });
                break;
                
            case 'video':
                await window.contentManagement.addVideo(formData.semester, formData.subject, {
                    title: formData.title,
                    description: formData.description,
                    link: formData.link
                });
                break;
        }
        
        
        const activePanel = document.querySelector('.tab-panel.active');
        if (activePanel) {
            window.contentManagement.loadContentPanel(activePanel.id);
        }
    } catch (error) {
        console.error('Error adding content:', error);
        throw error;
    }
}


async function handleEditContent(contentType, itemId, formData) {
    try {
        switch (contentType) {
            case 'subject':
                await window.contentManagement.editSubject(formData.semester, itemId, {
                    name: formData.name,
                    code: formData.code
                });
                break;
                
            case 'note':
                await window.contentManagement.editNote(formData.semester, formData.subject, itemId, {
                    title: formData.title,
                    description: formData.description,
                    link: formData.link
                });
                break;
                
            case 'video':
                await window.contentManagement.editVideo(formData.semester, formData.subject, itemId, {
                    title: formData.title,
                    description: formData.description,
                    link: formData.link
                });
                break;
        }
        
        
        const activePanel = document.querySelector('.tab-panel.active');
        if (activePanel) {
            window.contentManagement.loadContentPanel(activePanel.id);
        }
    } catch (error) {
        console.error('Error editing content:', error);
        throw error;
    }
}


window.modals = {
    showAddContentModal,
    showEditContentModal,
    showDeleteConfirmModal
}; 


