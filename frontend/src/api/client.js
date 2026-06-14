import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export const auth = {
  kayit: (data) => api.post('/auth/kayit', data),
  giris: (data) => api.post('/auth/giris', data),
  cikis: () => api.post('/auth/cikis'),
  ben: () => api.get('/auth/ben'),
};

export const gunTipleri = {
  liste: () => api.get('/gun-tipleri'),
  ekle: (data) => api.post('/gun-tipleri', data),
  guncelle: (id, data) => api.put(`/gun-tipleri/${id}`, data),
  sil: (id) => api.delete(`/gun-tipleri/${id}`),
  sirala: (items) => api.patch('/gun-tipleri/siralama', { items }),
};

export const varyasyonlar = {
  liste: (dayTypeId) => api.get(`/varyasyonlar/${dayTypeId}`),
  ekle: (data) => api.post('/varyasyonlar', data),
  guncelle: (id, data) => api.put(`/varyasyonlar/${id}`, data),
  sil: (id) => api.delete(`/varyasyonlar/${id}`),
};

export const egzersizler = {
  liste: (variationId) => api.get(`/egzersizler/${variationId}`),
  ekle: (data) => api.post('/egzersizler', data),
  guncelle: (id, data) => api.put(`/egzersizler/${id}`, data),
  arsivle: (id) => api.patch(`/egzersizler/${id}/arsiv`),
  sil: (id) => api.delete(`/egzersizler/${id}`),
};

export const seanslar = {
  olustur: (data) => api.post('/seanslar', data),
  tamamla: (id, data) => api.post(`/seanslar/${id}/tamamla`, data),
  onceki: (variationId, exerciseId) => api.get(`/seanslar/onceki/${variationId}/${exerciseId}`),
  gecmis: (exerciseId) => api.get(`/seanslar/gecmis/${exerciseId}`),
};

export const etiketler = {
  liste: () => api.get('/etiketler'),
  ekle: (data) => api.post('/etiketler', data),
  guncelle: (id, data) => api.put(`/etiketler/${id}`, data),
  sil: (id) => api.delete(`/etiketler/${id}`),
};
